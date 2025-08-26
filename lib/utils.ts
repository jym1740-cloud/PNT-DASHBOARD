// ... existing code ...

// Chart.js 안전성 함수들
export function safeMax(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  return validValues.length > 0 ? Math.max(...validValues) : 0;
}

export function safeMin(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  return validValues.length > 0 ? Math.min(...validValues) : 0;
}

export function safeAverage(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (validValues.length === 0) return 0;
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
}

export function safeNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

export function safeRegisterChartJS(ChartJS: any, plugin: any, pluginName: string): boolean {
  try {
    if (!ChartJS || !plugin) {
      console.warn(`Chart.js 또는 ${pluginName} 플러그인이 없습니다.`);
      return false;
    }
    
    // 이미 등록되어 있는지 확인
    if (ChartJS.registry && ChartJS.registry.controllers) {
      const existingControllers = Object.keys(ChartJS.registry.controllers);
      if (existingControllers.includes(pluginName)) {
        console.log(`${pluginName}이 이미 등록되어 있습니다.`);
        return true;
      }
    }
    
    // 플러그인 등록
    if (typeof plugin === 'function') {
      plugin(ChartJS);
      console.log(`${pluginName} 플러그인이 성공적으로 등록되었습니다.`);
      return true;
    } else if (plugin.default && typeof plugin.default === 'function') {
      plugin.default(ChartJS);
      console.log(`${pluginName} 플러그인이 성공적으로 등록되었습니다.`);
      return true;
    } else {
      console.warn(`${pluginName} 플러그인 형식이 올바르지 않습니다.`);
      return false;
    }
  } catch (error) {
    console.error(`${pluginName} 플러그인 등록 중 오류 발생:`, error);
    return false;
  }
}

export function validateChartData(data: any): boolean {
  try {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // 기본 구조 확인
    if (!data.labels || !data.datasets) {
      return false;
    }
    
    // labels가 배열인지 확인
    if (!Array.isArray(data.labels)) {
      return false;
    }
    
    // datasets가 배열인지 확인
    if (!Array.isArray(data.datasets)) {
      return false;
    }
    
    // 각 dataset의 기본 속성 확인
    for (const dataset of data.datasets) {
      if (!dataset.data || !Array.isArray(dataset.data)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('차트 데이터 검증 중 오류:', error);
    return false;
  }
}

export function validateChartOptions(options: any): boolean {
  try {
    if (!options || typeof options !== 'object') {
      return false;
    }
    
    // 필수 속성들이 존재하는지 확인
    const requiredProps = ['responsive', 'maintainAspectRatio'];
    for (const prop of requiredProps) {
      if (!(prop in options)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('차트 옵션 검증 중 오류:', error);
    return false;
  }
}

export function handleChartError(error: any, fallbackComponent: React.ReactNode) {
  console.error('Chart.js 오류 발생:', error);
  
  // 에러 타입별 분류
  if (error.name === 'TypeError') {
    if (error.message.includes('Chart')) {
      console.error('Chart.js 초기화 실패');
    } else if (error.message.includes('datalabels')) {
      console.error('차트 플러그인 로드 실패');
    }
  } else if (error.name === 'ReferenceError') {
    console.error('차트 라이브러리를 찾을 수 없음');
  }
  
  return fallbackComponent;
}