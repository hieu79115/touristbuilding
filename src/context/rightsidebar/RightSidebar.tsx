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
    }, [listPlaces]);

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
            const graph = buildGraphFromDistances(distances);
            const primResult = applyPrimAlgorithm(graph);
            setPrimResult(primResult);
            console.log('Prim Result:', primResult);

            setIsContentVisible(true);  // Hiển thị lộ trình khi tính toán xong

            // tinh tong chieu dai lo trinh
            setTotalDistance(prevTotalDistance => {
                const total = primResult.reduce((sum, edge) => sum + edge.weight, 0);
                return total;
            });
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
    ): Promise<RouteResult | null> => {
        try {
            const resp = await directionsApi.get<DirectionsResponse>(
                `/${start.join(',')};${end.join(',')}`
            );
    
            const route = resp.data.routes[0];
    
            if (!route) {
                console.error("No route found");
                return null;
            }
    
            const { distance, duration } = route;
    
            let kms = distance / 1000;
            kms = Math.round(kms * 100) / 100; // Sửa lỗi chia 100
    
            const minutes = Math.floor(duration / 60);
    
            console.log("Route:", route);
            console.log("Kilometers:", kms);
            console.log("Minutes:", minutes);
    
            return { kms, minutes };
        } catch (error) {
            console.error("Error fetching route:", error);
            return null;
        }
    };

    const calculateDistances = async (
        
    ): Promise<RouteResult[][]> => {    
        const distances: RouteResult[][] = []; 

        for (let i = 0; i < selectedFeatures.length; i++) {
            const element: RouteResult[] = []; 
            for (let j = 0; j < selectedFeatures.length; j++) {
                // Gọi hàm getRouteBetweenPoints với tọa độ của điểm bắt đầu và điểm kết thúc
                const startCoordinates: [number, number] = [selectedFeatures[i].center[0], selectedFeatures[i].center[1]];
                const endCoordinates: [number, number] = [selectedFeatures[j].center[0], selectedFeatures[j].center[1]];
                // Gọi hàm và chờ cho kết quả (do hàm là bất đồng bộ)
                try {
                    // Gọi hàm và chờ cho kết quả (do hàm là bất đồng bộ)
                    const routeResult = await getRouteBetweenPoints(startCoordinates, endCoordinates);
    
                    // Kiểm tra giá trị trả về của hàm getRouteBetweenPoints
                    if (routeResult !== null) {
                        // Nếu có giá trị trả về, thêm giá trị kms vào mảng element
                        element.push(routeResult);
                        console.log("Route calculation complete.");
                        console.log(element);
                    } else {
                        // Xử lý trường hợp không tìm thấy tuyến đường
                        console.error("No route found between", startCoordinates, "and", endCoordinates);
                        // Thêm một giá trị mặc định vào mảng element, hoặc bạn có thể thêm bất kỳ giá trị nào khác tùy thuộc vào logic của ứng dụng
                        element.push({ kms: 0, minutes: 0 });
                    }
                } catch (error) {
                    console.error("Error calculating route:", error);
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

    const buildGraphFromDistances = (distances: RouteResult[][]): Edge[] => {
        const graph: Edge[] = [];
    
        for (let i = 0; i < distances.length; i++) {
            for (let j = 0; j < distances[i].length; j++) {
                const { kms, minutes } = distances[i][j];
                graph.push({ start: i, end: j, weight: kms, minutes });
            }
        }
    
        return graph;
    };
    
    
    const applyPrimAlgorithm = (graph: Edge[]): Edge[] => {
        const visited: boolean[] = Array(graph.length).fill(false);
        const result: Edge[] = [];
        const priorityQueue: Edge[] = [];
        let totalMinutes = 0;
    
        // Bắt đầu từ đỉnh 0 (có thể chọn bất kỳ đỉnh nào)
        priorityQueue.push({ start: 0, end: 0, weight: 0, minutes: 0 });
    
        while (priorityQueue.length > 0) {
            priorityQueue.sort((a, b) => a.weight - b.weight);
            const { start, end, weight, minutes } = priorityQueue.shift()!;
    
            if (!visited[end]) {
                visited[end] = true;
                result.push({ start, end, weight, minutes });
                totalMinutes += minutes;
    
                // Thêm các đỉnh kề chưa được thăm vào hàng đợi ưu tiên
                for (const edge of graph.filter(e => e.start === end && !visited[e.end])) {
                    priorityQueue.push(edge);
                }
            }
        }
    
        setTotalMinutes(totalMinutes); // Cập nhật tổng thời gian
    
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
                <h3>Danh sách các địa điểm</h3>
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
                    <div className='header'>
                        <p>Lộ trình</p>
                        <button onClick={handleCloseButtonClick} className="close-button">
                            <img
                                width="10"
                                height="10"
                                src="https://img.icons8.com/ios/50/delete-sign--v1.png"
                                alt="delete-sign--v1"
                            />
                        </button>
                    </div>
                    <div className='content'>
                        <ul>
                        {primResult.map((edge) => (
                            edge.start !== edge.end && (
                                <li key={`${edge.start}-${edge.end}`}>
                                    {`${selectedFeatures[edge.start].text} -> ${selectedFeatures[edge.end].text} : ${edge.weight} kms, ${edge.minutes} minutes`}
                                </li>
                            )
                        ))}
                        </ul>
                        <p>
                            Tổng Chiều Dài: {totalDistance.toFixed(2)} kms
                            - Tổng Thời Gian: {totalMinutes} phút
                        </p>
                    </div>
                </div>
                
            )}
            </div>
        </>
    );
};
