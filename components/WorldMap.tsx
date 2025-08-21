"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Move, RotateCcw, X } from "lucide-react";
import { Project } from "@/lib/types";

interface WorldMapProps {
  projects: Project[];
}

interface CountryData {
  name: string;
  projects: Project[];
  statusCounts: { [key: string]: number };
  center: { lat: number; lng: number };
}

export default function WorldMap({ projects }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCountryDialog, setShowCountryDialog] = useState(false);

  // 상태별 마커 색상 함수
  const getMarkerColor = (status: string): string => {
    switch (status) {
      case "계획":
        return "#3B82F6"; // 파란색
      case "진행 중":
        return "#10B981"; // 초록색
      case "진행 중(관리필요)":
        return "#EF4444"; // 빨간색
      case "일시 중단":
        return "#F59E0B"; // 주황색
      case "완료":
        return "#6B7280"; // 회색
      default:
        return "#6B7280"; // 기본 회색
    }
  };

  // 최근 투입률 가져오기
  const getLatestCostRatio = (costHistory?: Array<{ costRatio: number; date: string }>): string => {
    if (!costHistory || costHistory.length === 0) {
      return '-';
    }
    
    // 날짜순 정렬 후 마지막 항목의 투입률
    const latestHistory = costHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return `${latestHistory.costRatio.toFixed(1)}%`;
  };

  // 최근 투입률 색상 가져오기
  const getLatestCostRatioColor = (costHistory?: Array<{ costRatio: number; date: string }>): string => {
    if (!costHistory || costHistory.length === 0) {
      return '#6B7280'; // 회색
    }
    
    // 날짜순 정렬 후 마지막 항목의 투입률
    const latestHistory = costHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const ratio = latestHistory.costRatio;
    
    if (ratio > 100) return '#DC2626'; // 빨간색
    if (ratio >= 80) return '#DC2626'; // 빨간색
    if (ratio >= 70) return '#D97706'; // 주황색
    return '#059669'; // 초록색
  };

  // 국가별 데이터 그룹화
  const groupProjectsByCountry = (): CountryData[] => {
    const countryGroups: { [key: string]: Project[] } = {};
    
    projects.forEach(project => {
      if (project.country && project.lat && project.lng) {
        if (!countryGroups[project.country]) {
          countryGroups[project.country] = [];
        }
        countryGroups[project.country].push(project);
      }
    });

    return Object.keys(countryGroups).map(countryName => {
      const countryProjects = countryGroups[countryName];
      
      // 상태별 개수 계산
      const statusCounts = countryProjects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // 국가 중심점 계산
      const lats = countryProjects.map(p => p.lat).filter(lat => lat !== undefined);
      const lngs = countryProjects.map(p => p.lng).filter(lng => lng !== undefined);
      const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
      const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

      return {
        name: countryName,
        projects: countryProjects,
        statusCounts,
        center: { lat: centerLat, lng: centerLng }
      };
    });
  };

  // 원형 차트 생성 함수
  const createPieChart = (countryData: CountryData, L: any): any => {
    const totalProjects = countryData.projects.length;
    const chartSize = Math.max(40, Math.min(80, totalProjects * 3)); // 프로젝트 수에 따라 크기 조절
    
    // 원형 차트 HTML 생성
    let chartHTML = `<div style="
      width: ${chartSize}px; 
      height: ${chartSize}px; 
      border-radius: 50%; 
      background: conic-gradient(`;
    
    let currentAngle = 0;
    const statusColors = {
      "계획": "#3B82F6",
      "진행 중": "#10B981", 
      "진행 중(관리필요)": "#EF4444",
      "일시 중단": "#F59E0B",
      "완료": "#6B7280"
    };
    
    Object.entries(countryData.statusCounts).forEach(([status, count], index) => {
      const percentage = (count / totalProjects) * 100;
      const angle = (percentage / 100) * 360;
      
      if (index > 0) chartHTML += ', ';
      chartHTML += `${statusColors[status as keyof typeof statusColors]} ${currentAngle}deg ${currentAngle + angle}deg`;
      
      currentAngle += angle;
    });
    
    chartHTML += `);
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${Math.max(10, chartSize / 4)}px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
    ">${totalProjects}</div>`;
    
    const icon = L.divIcon({
      className: 'country-chart',
      html: chartHTML,
      iconSize: [chartSize, chartSize],
      iconAnchor: [chartSize / 2, chartSize / 2]
    });
    
    const chart = L.marker([countryData.center.lat, countryData.center.lng], { icon });
    
    // 클릭 이벤트: 국가 선택하여 팝업 표시
    chart.on('click', () => {
      setSelectedCountry(countryData);
      setSelectedProject(null);
      setShowCountryDialog(true);
    });
    
    return chart;
  };

  useEffect(() => {
    // DOM이 준비되지 않았으면 리턴
    if (!mapRef.current) return;

    let map: any = null;

    const initMap = () => {
      try {
        // Leaflet이 이미 로드되어 있는지 확인
        if (typeof window !== 'undefined' && window.L) {
          createMap();
        } else {
          // Leaflet 로드
          loadLeaflet();
        }
      } catch (error) {
        console.error('지도 초기화 오류:', error);
      }
    };

    const loadLeaflet = () => {
      // CSS 로드
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // JS 로드
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        createMap();
      };
      document.head.appendChild(script);
    };

    const createMap = () => {
      try {
        const L = window.L;
        
        // 지도 생성
        map = L.map(mapRef.current!, {
          center: [25, 0],
          zoom: 2,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: false,
          touchZoom: true,
          minZoom: 2,
          maxZoom: 18,
          maxBounds: [
            [-60, -180],
            [85, 180]
          ],
          maxBoundsViscosity: 1.0
        });

        // 타일 레이어 추가
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
          minZoom: 2,
          noWrap: true,
          bounds: [
            [-60, -180],
            [85, 180]
          ]
        }).addTo(map);

        // 국가별 원형 차트 추가
        const countryData = groupProjectsByCountry();
        countryData.forEach(country => {
          const chart = createPieChart(country, L);
          chart.addTo(map);
        });

        // 지도 인스턴스 저장
        setMapInstance(map);
        console.log('지도 생성 완료 - 국가별 원형 차트 표시');
      } catch (error) {
        console.error('지도 생성 오류:', error);
      }
    };

    // 지도 초기화 시작
    initMap();

    // 정리 함수
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [projects]);

  // 줌 모드 전환 함수
  const toggleZoomMode = () => {
    if (mapInstance) {
      const newMode = !isZoomMode;
      setIsZoomMode(newMode);
      
      if (newMode) {
        mapInstance.dragging.enable();
        console.log('이동모드 ON - 드래그 이동 가능');
      } else {
        mapInstance.dragging.disable();
        console.log('이동모드 OFF - 드래그 이동 불가');
      }
    }
  };

  // 초기화 함수
  const resetMap = () => {
    if (mapInstance) {
      mapInstance.setView([25, 0], 2, { animate: true });
      setIsZoomMode(false);
      mapInstance.dragging.disable();
      setSelectedCountry(null);
      setSelectedProject(null);
      setShowCountryDialog(false);
      console.log('초기화 완료');
    }
  };

  // 프로젝트 선택 함수
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const closeCountryDialog = () => {
    setShowCountryDialog(false);
    setSelectedCountry(null);
    setSelectedProject(null);
  };

  // 프로젝트 정렬 함수 - 관리필요를 상단에 배치
  const sortProjectsByPriority = (projects: Project[]): Project[] => {
    const statusPriority = {
      "진행 중(관리필요)": 1,
      "일시 중단": 2,
      "진행 중": 3,
      "계획": 4,
      "완료": 5
    };

    return [...projects].sort((a, b) => {
      const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 6;
      const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 6;
      return priorityA - priorityB;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>글로벌 프로젝트 현황</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={isZoomMode ? "default" : "outline"}
            size="sm"
            onClick={toggleZoomMode}
            className="flex items-center gap-2"
          >
            <Move className="h-4 w-4" />
            {isZoomMode ? "이동모드 ON" : "이동모드 OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetMap}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 지도 영역 - 전체 너비 사용 */}
        <div className="w-full">
          <div 
            ref={mapRef} 
            className="w-full h-[500px] rounded-lg border bg-gray-50"
            style={{ minHeight: '500px' }}
          />
          <div className="mt-2 text-sm text-gray-500 text-center">
            {isZoomMode ? "드래그로 지도 이동 가능" : "줌 인만 가능 (2레벨 이상), 이동하려면 이동모드 ON"}
          </div>
        </div>

        {/* 국가 프로젝트 팝업 다이얼로그 */}
        <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedCountry?.name} 프로젝트 현황</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCountryDialog}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex gap-6 h-full">
              {/* 프로젝트 리스트 */}
              <div className="flex-1 space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  프로젝트 목록 ({selectedCountry?.projects.length}개)
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortProjectsByPriority(selectedCountry?.projects || []).map((project, index) => (
                    <div
                      key={project.id || index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedProject?.id === project.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getMarkerColor(project.status) }}
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {project.status}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.pjtNo} • {getLatestCostRatio(project.costHistory)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 프로젝트 상세 정보 */}
              {selectedProject && (
                <div className="w-80 space-y-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    프로젝트 상세 정보
                  </div>
                  <Card>
                    <CardContent className="space-y-3 pt-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">프로젝트 번호</div>
                        <div className="text-sm font-medium">{selectedProject.pjtNo || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">프로젝트명</div>
                        <div className="text-sm font-medium">{selectedProject.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">상태</div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getMarkerColor(selectedProject.status) }}
                          />
                          <span className="text-sm">{selectedProject.status}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">투입률</div>
                        <div 
                          className="text-sm font-medium"
                          style={{ color: getLatestCostRatioColor(selectedProject.costHistory) }}
                        >
                          {getLatestCostRatio(selectedProject.costHistory)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">비고</div>
                        <div className="text-sm text-gray-700">
                          {selectedProject.note || '-'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
