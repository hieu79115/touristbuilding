import React, { useContext, useEffect, useState, useRef } from 'react';
import { MapContext } from '../maps/MapContext';
import './RightSidebar.css';
import { Feature } from '../../interfaces/places';
import { directionsApi } from '../../apis';
import { DirectionsResponse } from '../../interfaces/directions';
import { Edge, Route } from '../../interfaces/graph';
import { SyncLoader } from 'react-spinners';

export const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);

    const { updateListPlaces } = useContext(MapContext);
    const { updateAllowClick } = useContext(MapContext);
    const { flyTo } = useContext(MapContext);
    const { listPlaces } = useContext(MapContext);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const [isContentVisible, setIsContentVisible] = useState(false);
    const sidebarContentRef = useRef<HTMLDivElement>(null);

    const [dijkstraResult, setDijkstraResult] = useState<Edge[]>([]);
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [totalMinutes, setTotalMinutes] = useState<number>(0);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const [isEditing, setIsEditing] = useState<Array<boolean>>(
        new Array(selectedFeatures.length).fill(false)
    );

    const handleDragStart = (
        e: React.DragEvent<HTMLUListElement>,
        index: number
    ) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    };

    const handleDragOver = (
        e: React.DragEvent<HTMLUListElement>,
        index: number
    ) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
        if (draggedIndex !== null && draggedIndex !== index) {
            const newListPlaces = Array.from(listPlaces);
            const [draggedItem] = newListPlaces.splice(draggedIndex, 1);
            newListPlaces.splice(index, 0, draggedItem);
            if (draggedIndex !== index) {
                updateListPlaces(newListPlaces);
                setDraggedIndex(index);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLUListElement>) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e: React.DragEvent<HTMLUListElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        setDraggedIndex(null);
    };

    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            if (
                isOpen &&
                sidebarContentRef.current &&
                !sidebarContentRef.current.contains(e.target as Node)
            ) {
                setIsContentVisible(false);
                setIsOverlayVisible(false);
                updateAllowClick(true);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleDocumentClick);
        }

        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [isOpen, updateAllowClick]);

    useEffect(() => {
        setSelectedFeatures(listPlaces);
    }, [listPlaces, selectedFeatures]);

    const handleDeleteButtonClick = (index: number) => {
        const newListPlaces = selectedFeatures.filter((_, i) => i !== index);
        setSelectedFeatures(newListPlaces.slice());
        updateListPlaces(newListPlaces);
    };

    const handleFloatingButtonClick = async () => {
        try {
            setIsLoading(true);
            const distances = await calculateDistances();
            const completeGraph = buildCompleteGraph(
                distances,
                selectedFeatures
            );
            const dijkstraResult = applyDijkstraAlgorithm(completeGraph, 0);

            setDijkstraResult(dijkstraResult);

            setIsContentVisible(true);
            setIsOverlayVisible(true);
            updateAllowClick(false);

            setTotalMinutes(
                dijkstraResult.reduce((sum, edge) => sum + edge.minutes, 0)
            );

            setTotalDistance(
                dijkstraResult.reduce((sum, edge) => sum + edge.weight, 0)
            );
            setIsLoading(false);
        } catch (error) {
            console.error('Error calculating distances:', error);
        }
    };

    const handleOverlayClick = () => {
        setIsContentVisible(false);
        setIsOverlayVisible(false);
    };

    const handleCloseButtonClick = () => {
        setIsContentVisible(false);
        setIsOverlayVisible(false);
        updateAllowClick(true);
    };

    const handleInputChange = (index: number, value: string) => {
        const updateFeature = [...selectedFeatures];
        updateFeature[index].text = value;
        updateListPlaces(updateFeature);
    };

    const handleToggleEdit = (index: number) => {
        const newIsEditing = [...isEditing];
        newIsEditing[index] = !newIsEditing[index];
        setIsEditing(newIsEditing);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const handleFlyTo = (e: React.MouseEvent, index: number) => {
        if (!isEditing[index] && !(e.target instanceof HTMLInputElement)) {
            console.log('Fly to:', selectedFeatures[index].text);
            flyTo(
                selectedFeatures[index].center[0],
                selectedFeatures[index].center[1]
            );
        }
    };

    const getRouteBetweenPoints = async (
        start: [number, number],
        end: [number, number]
    ): Promise<Route> => {
        try {
            const resp = await directionsApi.get<DirectionsResponse>(
                `/${start.join(',')};${end.join(',')}`
            );

            const route = resp.data.routes[0];

            if (!route) {
                console.error('No route found');
                return { kms: 0, minutes: 0 };
            }

            const { distance, duration } = route;

            let kms = distance / 1000;
            kms = Math.round(kms * 100) / 100;
            const minutes = Math.floor(duration / 60);

            return { kms, minutes };
        } catch (error) {
            console.error('Error fetching route:', error);
            return { kms: 0, minutes: 0 };
        }
    };

    const calculateDistances = async (): Promise<Route[][]> => {
        const distances: Route[][] = [];
        for (let i = 0; i < selectedFeatures.length; i++) {
            const element: Route[] = [];
            for (let j = 0; j < selectedFeatures.length; j++) {
                const startCoordinates: [number, number] = [
                    selectedFeatures[i].center[0],
                    selectedFeatures[i].center[1],
                ];
                const endCoordinates: [number, number] = [
                    selectedFeatures[j].center[0],
                    selectedFeatures[j].center[1],
                ];
                try {
                    const routeResult = await getRouteBetweenPoints(
                        startCoordinates,
                        endCoordinates
                    );

                    element.push(routeResult);
                    console.log('Route calculation complete.');
                } catch (error) {
                    console.error('Error calculating route:', error);
                }
            }
            distances.push(element);
        }

        console.log(distances);
        return distances;
    };

    const buildCompleteGraph = (
        distances: Route[][],
        selectedFeatures: Feature[]
    ): Edge[] => {
        const graph: Edge[] = [];

        selectedFeatures.forEach((featureI, i) => {
            selectedFeatures.forEach((featureJ, j) => {
                if (i !== j) {
                    const { kms, minutes } = distances[i][j];

                    graph.push({
                        start: i,
                        end: j,
                        weight: kms,
                        minutes,
                    });
                }
            });
        });

        return graph;
    };

    const applyDijkstraAlgorithm = (
        graph: Edge[],
        startVertex: number
    ): Edge[] => {
        const result: Edge[] = [];
        const visited: Set<number> = new Set();
        let currentVertex = startVertex;

        const chooseNextVertex = () => {
            const unvisitedVertices = graph
                .filter((edge) => !visited.has(edge.start))
                .map((edge) => edge.start);

            if (unvisitedVertices.length > 0) {
                currentVertex = unvisitedVertices[0];
            } else {
                return null;
            }
        };

        while (visited.size < graph.length) {
            visited.add(currentVertex);

            const currentVertexValue = currentVertex;

            const availableEdges = graph.filter(
                (edge) =>
                    edge.start === currentVertexValue && !visited.has(edge.end)
            );

            if (availableEdges.length > 0) {
                const minEdge = availableEdges.reduce(
                    (min, edge) => (edge.weight < min.weight ? edge : min),
                    {
                        start: -1,
                        end: -1,
                        weight: Number.POSITIVE_INFINITY,
                        minutes: Number.POSITIVE_INFINITY,
                    }
                );

                result.push(minEdge);

                currentVertex = minEdge.end;
            } else {
                if (chooseNextVertex() === null) {
                    break;
                }
            }
        }

        return result;
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`toggle-button ${
                    isOpen ? 'open open-transition' : ''
                }, ${isContentVisible ? 'disabled' : ''}`}
            >
                {isOpen ? 'Close Sidebar' : 'Open Sidebar'}
            </button>

            <div
                className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}
                ref={sidebarContentRef}
            >
                <h3 style={{ margin: '1rem' }}>Danh sách địa điểm</h3>

                <div
                    className={`container ${
                        isContentVisible ? 'disabled' : ''
                    } container-scrollable`}
                >
                    {selectedFeatures.map((feature, index) => (
                        <ul
                            className="list-item"
                            key={index}
                            draggable
                            onClick={(e) => handleFlyTo(e, index)}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <form
                                onSubmit={handleSubmit}
                                className="containerForm"
                            >
                                <input
                                    type="text"
                                    value={feature.text}
                                    onChange={(e) =>
                                        handleInputChange(index, e.target.value)
                                    }
                                    onClick={(e) => handleFlyTo(e, index)}
                                    className={`input ${
                                        isEditing[index] ? 'editable' : ''
                                    }`}
                                    disabled={!isEditing[index]}
                                />
                                <div className="margin-left-auto">
                                    <button
                                        type={
                                            isEditing[index]
                                                ? 'button'
                                                : 'submit'
                                        }
                                        className="button"
                                        onClick={() => handleToggleEdit(index)}
                                    >
                                        <img
                                            width="15"
                                            height="15"
                                            src={
                                                isEditing[index]
                                                    ? 'https://img.icons8.com/windows/32/create-new.png'
                                                    : 'https://img.icons8.com/windows/32/edit.png'
                                            }
                                            alt={
                                                isEditing[index]
                                                    ? 'create-new'
                                                    : 'edit'
                                            }
                                        />
                                    </button>
                                </div>
                            </form>
                            <li className="padding-0">
                                <button
                                    className="button delete-button"
                                    onClick={() =>
                                        handleDeleteButtonClick(index)
                                    }
                                >
                                    <img
                                        width="15"
                                        height="15"
                                        src="https://img.icons8.com/ios/50/delete-sign--v1.png"
                                        alt="delete-sign--v1"
                                    />
                                </button>
                            </li>
                        </ul>
                    ))}

                    {isOverlayVisible && (
                        <div className="overlay" onClick={handleOverlayClick} />
                    )}
                </div>

                <button
                    onClick={handleFloatingButtonClick}
                    className={`floating-button ${
                        isOverlayVisible ? 'disabled' : ''
                    }`}
                >
                    {isLoading ? ( // Nếu đang loading, hiển thị SpinLoader
                        <SyncLoader color="rgba(0, 0, 0, 1)" size={4} />
                    ) : (
                        // Nếu không loading, hiển thị nội dung bình thường
                        'Start'
                    )}
                </button>

                {isContentVisible && (
                    <div className="sidebar-content">
                        <div className="header">
                            <p>Lịch Trình</p>
                            <button
                                onClick={handleCloseButtonClick}
                                className="close-button"
                            >
                                <img
                                    width="10"
                                    height="10"
                                    src="https://img.icons8.com/ios/50/delete-sign--v1.png"
                                    alt="delete-sign--v1"
                                />
                            </button>
                        </div>
                        <div className="content">
                            <ul>
                                {dijkstraResult.map(
                                    (edge, index) =>
                                        edge.start !== edge.end && (
                                            <li
                                                key={`${edge.start}-${edge.end}`}
                                            >
                                                {`${index + 1}.  ${
                                                    selectedFeatures[edge.start]
                                                        .text
                                                } -> ${
                                                    selectedFeatures[edge.end]
                                                        .text
                                                } : ${edge.weight} kms, `}
                                                {edge.minutes > 60
                                                    ? `${Math.floor(
                                                          edge.minutes / 60
                                                      )} giờ ${
                                                          edge.minutes % 60
                                                      } phút`
                                                    : `${edge.minutes} phút`}
                                            </li>
                                        )
                                )}
                            </ul>
                            <p>
                                Tổng Chiều Dài: {totalDistance.toFixed(2)} kms -
                                Tổng Thời Gian:{' '}
                                {totalMinutes > 60
                                    ? `${Math.floor(totalMinutes / 60)} giờ ${
                                          totalMinutes % 60
                                      } phút`
                                    : `${totalMinutes} phút`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
