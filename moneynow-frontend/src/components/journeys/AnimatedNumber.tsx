import React, { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const from = startValue.current;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - Math.min(progress / duration, 1), 4);
      
      const current = from + (value - from) * easeProgress;
      setDisplayValue(current);

      if (progress < duration) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        startValue.current = value;
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  // Format currency if it's large, else just commas
  const formatNumber = (num: number) => {
    const val = Math.round(num);
    return new Intl.NumberFormat("en-IN").format(val);
  };

  return (
    <span className={className}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
};
