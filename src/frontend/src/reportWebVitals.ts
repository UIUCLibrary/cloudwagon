import { MetricType } from 'web-vitals';


const reportWebVitals = (onPerfEntry?: MetricType) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({
        onCLS,
        onFCP,
        onTTFB,
        onLCP,
                                 // getCLS, getFID, getFCP, getLCP, getTTFB
    }) => {
      onCLS(console.log);
      onFCP(console.log);
      onLCP(console.log);
      onTTFB(console.log);
    });
  }
};

export default reportWebVitals;
