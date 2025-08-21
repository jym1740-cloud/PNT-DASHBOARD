'use client';

import React, { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Project } from '@/lib/types';
import { getStatusInfo } from '@/lib/utils';

// Leaflet 아이콘 생성을 위한 함수 (훅 제거)
const iconCache: Record<string, any> = {};

const createLeafletIcon = (iconPath: string) => {
  // 캐시된 아이콘이 있으면 즉시 반환
  if (iconPath in iconCache) {
    return iconCache[iconPath];
  }
  
  // Leaflet이 로드된 후에만 호출됨
  try {
    const L = (window as any).L;
    if (!L || !L.icon) {
      console.log('Leaflet이 로드되지 않음:', iconPath);
      return null;
    }
    
    // 마커 아이콘 생성
    const leafletIcon = L.icon({
      iconUrl: iconPath,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    
    // 캐시에 저장 (다음 호출 시 빠르게 반환)
    iconCache[iconPath] = leafletIcon;
    console.log('아이콘 생성 성공:', iconPath);
    
    return leafletIcon;
  } catch (error) {
    console.error('아이콘 생성 실패:', iconPath, error);
    return null;
  }
};

interface OptimizedMarkerProps {
  project: Project;
  onMapClick: (evt: any) => void;
}

export default function OptimizedMarker({ project, onMapClick }: OptimizedMarkerProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // 상태별 색상 및 마커 아이콘 결정 (메모이제이션)
  const statusConfig = useMemo(() => {
    switch (project.status) {
      case "진행 중(관리필요)":
        return {
          color: "#ef4444",
          bgColor: "#fef2f2",
          textColor: "#dc2626",
          icon: "/marker-management.png"
        };
      case "진행 중":
        return {
          color: "#3b82f6",
          bgColor: "#eff6ff",
          textColor: "#2563eb",
          icon: "/marker-active.png"
        };
      case "일시 중단":
        return {
          color: "#eab308",
          bgColor: "#fefce8",
          textColor: "#ca8a04",
          icon: "/marker-hold.png"
        };
      case "완료":
        return {
          color: "#22c55e",
          bgColor: "#f0fdf4",
          textColor: "#16a34a",
          icon: "/marker-completed.png"
        };
      default: // 계획
        return {
          color: "#9ca3af",
          bgColor: "#f9fafb",
          textColor: "#6b7280",
          icon: "/marker-planning.png"
        };
    }
  }, [project.status]);

  // 아이콘 생성 함수로 아이콘 생성 (메모이제이션)
  const markerIconInstance = useMemo(() => {
    return createLeafletIcon(statusConfig.icon);
  }, [statusConfig.icon]);

  // 아이콘이 로드되지 않았으면 마커를 렌더링하지 않음
  if (!markerIconInstance || !project.lat || !project.lng || isNaN(project.lat) || isNaN(project.lng)) {
    return null;
  }

  return (
    <Marker 
      key={`marker-${project.id}`} 
      position={[project.lat, project.lng]}
      icon={markerIconInstance}
      eventHandlers={{
        click: () => setIsPopupOpen(true),
        popupclose: () => setIsPopupOpen(false)
      }}
    >
      <Popup>
        <div className="text-sm min-w-[200px]">
          <div className="font-semibold text-base mb-2">{project.name}</div>
          <div className="text-gray-600 text-xs mb-1">프로젝트 번호: {project.pjtNo}</div>
          
          {/* 상태 표시 */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">상태:</span>
              <span className="text-xs font-medium" style={{ color: statusConfig.color }}>
                {project.status}
              </span>
            </div>
          </div>
          
          {/* 투입률 표시 */}
          <div className="mb-2">
            {project.budget && project.actualCost && project.budget > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">투입률:</span>
                <span className={`text-xs font-medium ${
                  (project.actualCost / project.budget) * 100 > 80 ? 'text-red-600' :
                  (project.actualCost / project.budget) * 100 > 70 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {((project.actualCost / project.budget) * 100).toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-400">예산 정보 없음</div>
            )}
          </div>
          
          {/* 비고 표시 */}
          {project.note && (
            <div className="border-t pt-2">
              <div className="text-xs text-gray-600 mb-1">비고:</div>
              <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                {project.note}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
