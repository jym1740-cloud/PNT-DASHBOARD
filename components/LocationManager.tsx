"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Info, Copy, MapPin } from "lucide-react";

interface LocationManagerProps {
  lat: number | undefined;
  lng: number | undefined;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationManager({ lat, lng, onLocationChange }: LocationManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 컴포넌트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // Leaflet 지도 초기화
  useEffect(() => {
    if (!mounted || !mapRef.current) {
      return;
    }

    const initMap = async () => {
      try {
        // Leaflet CSS 로드
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // createMap 함수 정의
        const createMap = () => {
          const L = (window as any).L;
          if (!L) {
            console.error('Leaflet not loaded');
            return;
          }

          // 기존 지도 제거
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }

          // 새 지도 생성
          const map = L.map(mapRef.current!, {
            center: [lat || 37.5665, lng || 126.9780],
            zoom: 13,
            zoomControl: true,
            attributionControl: false
          });

          mapInstanceRef.current = map;

          // 타일 레이어 추가
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            minZoom: 3
          }).addTo(map);

          // 마커 추가 (좌표가 있는 경우)
          if (lat && lng) {
            markerRef.current = L.marker([lat, lng]).addTo(map);
            markerRef.current.bindPopup(`위도: ${lat.toFixed(6)}<br>경도: ${lng.toFixed(6)}`);
          }

          // 지도 클릭 이벤트
          map.on('click', (e: any) => {
            const { lat: newLat, lng: newLng } = e.latlng;
            
            // 기존 마커 제거
            if (markerRef.current) {
              map.removeLayer(markerRef.current);
            }
            
            // 새 마커 추가
            markerRef.current = L.marker([newLat, newLng]).addTo(map);
            markerRef.current.bindPopup(`위도: ${newLat.toFixed(6)}<br>경도: ${newLng.toFixed(6)}`);
            
            // 좌표 변경 콜백 호출
            onLocationChange(newLat, newLng);
          });
        };

        // Leaflet JavaScript 로드
        if (typeof window !== 'undefined' && !(window as any).L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => {
            createMap();
          };
          document.head.appendChild(script);
        } else {
          createMap();
        }

      } catch (error) {
        console.error('LocationManager: 지도 초기화 오류:', error);
      }
    };

    initMap();

    // 클린업
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, lat, lng, onLocationChange]);

  // 구글 맵에서 검색
  const openGoogleMaps = () => {
    if (!addressSearch.trim()) {
      alert('검색할 주소를 입력해주세요.');
      return;
    }
    
    // 구글 맵 검색 URL 생성
    const searchQuery = encodeURIComponent(addressSearch);
    const googleMapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
    
    // 새 탭에서 구글 맵 열기
    window.open(googleMapsUrl, '_blank');
  };

  if (!mounted) {
    return (
      <div className="w-full h-[400px] rounded-lg border bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-[400px] rounded-lg border bg-gray-50" />
      
      <p className="text-xs text-zinc-500">
        지도를 클릭하여 좌표를 설정하거나, 아래에서 주소를 검색하여 좌표를 찾을 수 있습니다.
      </p>
      
      {/* 구글 맵 검색창 */}
      <div>
        <Label>구글 맵에서 주소 검색</Label>
        <div className="flex gap-2">
          <Input 
            placeholder="주소를 입력하세요 (예: 서울시 강남구)" 
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && openGoogleMaps()}
          />
          <Button 
            onClick={openGoogleMaps} 
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
          >
            🌍 구글맵
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          구글맵에서 주소를 검색한 후, 좌표를 복사해서 아래 입력란에 붙여넣으세요
        </p>
      </div>
      
      {/* 위도/경도 직접 입력 */}
      <div>
        <Label className="mb-2 block">좌표 직접 입력</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="lat-input" className="text-xs text-gray-600 mb-1 block">위도 (Latitude)</Label>
            <Input 
              id="lat-input"
              type="number" 
              step="any"
              value={lat ?? ''} 
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : Number(e.target.value);
                onLocationChange(value || 0, lng || 0);
              }} 
              placeholder="37.5665" 
              className="text-sm h-9"
            />
          </div>
          <div>
            <Label htmlFor="lng-input" className="text-xs text-gray-600 mb-1 block">경도 (Longitude)</Label>
            <Input 
              id="lng-input"
              type="number" 
              step="any"
              value={lng ?? ''} 
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : Number(e.target.value);
                onLocationChange(lat || 0, value || 0);
              }} 
              placeholder="126.9780" 
              className="text-sm h-9"
            />
          </div>
        </div>
        
        {/* 좌표 붙여넣기 기능 */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Copy className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">좌표 붙여넣기</span>
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="37.5665, 126.9780 (구글맵에서 복사한 좌표)" 
              className="text-xs h-8"
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                const coordinates = pastedText.trim().split(',');
                
                if (coordinates.length === 2) {
                  const latValue = parseFloat(coordinates[0].trim());
                  const lngValue = parseFloat(coordinates[1].trim());
                  
                  if (!isNaN(latValue) && !isNaN(lngValue)) {
                    onLocationChange(latValue, lngValue);
                    e.currentTarget.value = '';
                  } else {
                    alert('올바른 좌표 형식이 아닙니다. "위도, 경도" 형태로 입력해주세요.');
                  }
                } else {
                  alert('좌표를 "위도, 경도" 형태로 입력해주세요. (예: 37.5665, 126.9780)');
                }
              }}
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-8 px-3"
              onClick={() => {
                const input = document.querySelector('input[placeholder*="구글맵에서 복사한 좌표"]') as HTMLInputElement;
                if (input) {
                  input.focus();
                  input.select();
                }
              }}
            >
              붙여넣기
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            구글맵에서 복사한 좌표를 위 입력란에 붙여넣으면 자동으로 위도와 경도가 분리됩니다
          </p>
        </div>
        
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span>💡</span>
          <span>좌표를 직접 입력하거나, 지도를 클릭하여 위치를 설정할 수 있습니다</span>
        </div>
      </div>
    </div>
  );
}
