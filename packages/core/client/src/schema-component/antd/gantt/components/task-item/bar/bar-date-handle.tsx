import React from 'react';

type BarDateHandleProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  barCornerRadius: number;
  onMouseDown: (event: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
};
export const BarDateHandle: React.FC<BarDateHandleProps> = ({ x, y, width, height, barCornerRadius, onMouseDown }) => {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      className={'barHandle'}
      ry={barCornerRadius}
      rx={barCornerRadius}
      onMouseDown={onMouseDown}
    />
  );
};
