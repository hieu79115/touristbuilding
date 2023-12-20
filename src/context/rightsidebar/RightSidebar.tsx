import React, { useContext, useEffect, useState } from 'react';
import { MapContext } from '../maps/MapContext';
import './RightSidebar.css';
import { Feature } from '../../interfaces/places';
import { directionsApi } from '../../apis';
import { DirectionsResponse } from '../../interfaces/directions';

export const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
    const { updateListPlaces } = useContext(MapContext);

    const { listPlaces } = useContext(MapContext);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isContentVisible, setIsContentVisible] = useState(false);
    const [primResult, setPrimResult] = useState<Edge[]>([]);
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [totalMinutes, setTotalMinutes] = useState<number>(0);

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
        setSelectedFeatures(listPlaces);
        console.log('List places:');
        console.log(selectedFeatures);
    }, [listPlaces, selectedFeatures]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        console.log('List seleted Features:');
        console.log(selectedFeatures.length);
    }, [selectedFeatures.length]);

    const handleDeleteButtonClick = (index: number) => {
        const newListPlaces = selectedFeatures.filter((_, i) => i !== index);
        setSelectedFeatures(newListPlaces.slice());
        updateListPlaces(newListPlaces);
        console.log(`Deleting feature with ID: ${index}`);
    };

    const handleFloatingButtonClick = async () => {
        try {
            const distances = await calculateDistances();
            // Sử dụng hàm buildCompleteGraph để xây dựng đồ thị từ khoảng cách
            const completeGraph = buildCompleteGraph(distances, selectedFeatures);
            const dijkstraResult = applyDijkstraAlgorithm(completeGraph, 0);
    
            setPrimResult(dijkstraResult);
            console.log('Dijkstra Result:', dijkstraResult);
    
            setIsContentVisible(true);
    
            setTotalMinutes(
                dijkstraResult.reduce((sum, edge) => sum + edge.minutes, 0)
            );

            setTotalDistance(
                dijkstraResult.reduce((sum, edge) => sum + edge.weight, 0)
            );
        } catch (error) {
            console.error('Error calculating distances:', error);
        }
    };
            
    const handleCloseButtonClick = () => {
        setIsContentVisible(false);
    };

    interface RouteResult {
        kms: number;
        minutes: number;
    }

    const getRouteBetweenPoints = async (
        start: [number, number],
        end: [number, number]
    ): Promise<RouteResult> => {
        try {
            const resp = await directionsApi.get<DirectionsResponse>(
                `/${start.join(',')};${end.join(',')}`
            );

            const route = resp.data.routes[0];

            if (!route) {
                console.error("No route found");
                // Trả về giá trị mặc định khi không tìm thấy tuyến đường
                return { kms: 0, minutes: 0 };
            }

            const { distance, duration } = route;

            let kms = distance / 1000;
            kms = Math.round(kms * 100) / 100; // Sửa lỗi chia 100
            const minutes = Math.floor(duration / 60);

            // console.log('Route:', route);
            // console.log('Kilometers:', kms);
            // console.log('Minutes:', minutes);

            return { kms, minutes };
        } catch (error) {
            console.error("Error fetching route:", error);
            // Trả về giá trị mặc định khi có lỗi
            return { kms: 0, minutes: 0 };
        }
    };
    
    

    const calculateDistances = async (): Promise<RouteResult[][]> => {
        const distances: RouteResult[][] = [];
        for (let i = 0; i < selectedFeatures.length; i++) {
            const element: RouteResult[] = [];
            for (let j = 0; j < selectedFeatures.length; j++) {
                // Thay đổi từ number[] sang [number, number]
                const startCoordinates: [number, number] = [
                    selectedFeatures[i].center[0],
                    selectedFeatures[i].center[1],
                ];
                const endCoordinates: [number, number] = [
                    selectedFeatures[j].center[0],
                    selectedFeatures[j].center[1],
                ];
                // Gọi hàm và chờ cho kết quả (do hàm là bất đồng bộ)
                try {
                    // Gọi hàm và chờ cho kết quả (do hàm là bất đồng bộ)
                    const routeResult = await getRouteBetweenPoints(
                        startCoordinates,
                        endCoordinates
                    );
    
                    element.push(routeResult);
                    console.log("Route calculation complete.");
                    // console.log(element);
                } catch (error) {
                    console.error('Error calculating route:', error);
                }
            }
            distances.push(element);
        }
    
        console.log(distances);
        return distances;
    };
    
    interface Edge {
        start: number;
        end: number;
        weight: number;
        minutes: number;
    }

    const buildCompleteGraph = (
        distances: RouteResult[][],
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
      
        // Định nghĩa hàm ngoại trọng vòng lặp
        const chooseNextVertex = () => {
          const unvisitedVertices = graph
            .filter((edge) => !visited.has(edge.start))
            .map((edge) => edge.start);
      
          if (unvisitedVertices.length > 0) {
            currentVertex = unvisitedVertices[0];
          } else {
            return null; // Kết thúc nếu đã ghé thăm tất cả các điểm
          }
        };
      
        while (visited.size < graph.length) {
          visited.add(currentVertex);
      
          // Tạo biến khác để lưu giữ giá trị của currentVertex
          const currentVertexValue = currentVertex;
      
          const availableEdges = graph.filter(
            (edge) => edge.start === currentVertexValue && !visited.has(edge.end)
          );
      
          if (availableEdges.length > 0) {
            // Chọn cạnh ngắn nhất và thêm vào kết quả
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
      
            // Di chuyển đến đỉnh kết thúc của cạnh
            currentVertex = minEdge.end;
          } else {
            // Nếu không còn cạnh đi tiếp, chọn đỉnh chưa được ghé thăm làm điểm xuất phát
            if (chooseNextVertex() === null) {
              break; // Kết thúc nếu đã ghé thăm tất cả các điểm
            }
          }
        }
      
        return result;
      };
      
      


      
    return (
        <>
            <button
                onClick={toggleSidebar}
                className={`toggle-button ${isOpen ? 'open' : ''}`}
            >
                {isOpen ? 'Close Sidebar' : 'Open Sidebar'}
            </button>
            <div className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}>
                <h3>Danh sách địa điểm</h3>
                <div className="container">
                    {selectedFeatures.map((feature, index) => (
                        <ul
                            className="list-item"
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <li key={feature.id}>{feature.text}</li>
                            <li className="detele">
                                <button
                                    className="delete-button"
                                    onClick={() =>
                                        handleDeleteButtonClick(index)
                                    }
                                >
                                    <img
                                        width="10"
                                        height="10"
                                        src="https://img.icons8.com/ios/50/delete-sign--v1.png"
                                        alt="delete-sign--v1"
                                    />
                                </button>
                            </li>
                        </ul>
                    ))}
                </div>

                <button
                    onClick={handleFloatingButtonClick}
                    className="floating-button"
                >
                    Floating Button
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
                                {primResult.map(
                                    (edge, index) =>
                                        edge.start !== edge.end && (
                                            <li
                                                key={`${edge.start}-${edge.end}`}
                                            >
                                                {`${index+1}.  ${
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
