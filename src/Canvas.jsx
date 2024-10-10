import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, RegularPolygon, Transformer } from 'react-konva';

const Canvas = () => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [selectedId, selectShape] = useState(null);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  useEffect(() => {
    if (selectedId) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  const handleMouseDown = (e) => {
    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        selectShape(null);
      }
      return;
    }

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'pen') {
      setLines([...lines, { tool, points: [pos.x, pos.y], color, strokeWidth }]);
    } else {
      const newShape = {
        id: `shape_${shapes.length + 1}`,
        tool,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color,
        strokeWidth,
      };
      setShapes([...shapes, newShape]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (tool === 'pen') {
      let lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      setLines([...lines.slice(0, -1), lastLine]);
    } else {
      let lastShape = shapes[shapes.length - 1];
      lastShape.width = point.x - lastShape.x;
      lastShape.height = point.y - lastShape.y;
      setShapes([...shapes.slice(0, -1), lastShape]);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  const handleWidthChange = (e) => {
    setStrokeWidth(parseInt(e.target.value));
  };

  const handleShapeDragEnd = (e, id) => {
    const updatedShapes = shapes.map(shape => 
      shape.id === id ? { ...shape, x: e.target.x(), y: e.target.y() } : shape
    );
    setShapes(updatedShapes);
  };

  const handleShapeTransformEnd = (e, id) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    const updatedShapes = shapes.map(shape => {
      if (shape.id === id) {
        if (shape.tool === 'circle') {
          const newRadius = Math.max(Math.abs(shape.width * scaleX), Math.abs(shape.height * scaleY)) / 2;
          return {
            ...shape,
            width: newRadius * 2,
            height: newRadius * 2,
            x: node.x() - newRadius,
            y: node.y() - newRadius,
          };
        } else if (shape.tool === 'triangle') {
          const newWidth = Math.abs(shape.width * scaleX);
          const newHeight = Math.abs(shape.height * scaleY);
          return {
            ...shape,
            width: newWidth,
            height: newHeight,
            x: node.x(),
            y: node.y(),
          };
        } else {
          return {
            ...shape,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, Math.abs(shape.width * scaleX)),
            height: Math.max(5, Math.abs(shape.height * scaleY)),
          };
        }
      }
      return shape;
    });
    setShapes(updatedShapes);
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <select value={tool} onChange={(e) => setTool(e.target.value)}>
          <option value="pen">Pen</option>
          <option value="line">Line</option>
          <option value="square">Square</option>
          <option value="rectangle">Rectangle</option>
          <option value="triangle">Triangle</option>
          <option value="circle">Circle</option>
          <option value="comment">Comment Bubble</option>
        </select>
        <input type="color" value={color} onChange={handleColorChange} />
        <input
          type="range"
          min="1"
          max="50"
          value={strokeWidth}
          onChange={handleWidthChange}
        />
        {strokeWidth}px
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 50}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {shapes.map((shape) => {
            if (shape.tool === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x + shape.width / 2}
                  y={shape.y + shape.height / 2}
                  radius={Math.abs(shape.width) / 2}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  draggable
                  onClick={() => selectShape(shape.id)}
                  onDragEnd={(e) => handleShapeDragEnd(e, shape.id)}
                  onTransformEnd={(e) => handleShapeTransformEnd(e, shape.id)}
                />
              );
            } else if (shape.tool === 'triangle') {
              return (
                <RegularPolygon
                  key={shape.id}
                  id={shape.id}
                  x={shape.x + shape.width / 2}
                  y={shape.y + shape.height / 2}
                  sides={3}
                  radius={Math.sqrt(shape.width * shape.width + shape.height * shape.height) / 2}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  rotation={Math.atan2(shape.height, shape.width) * (180 / Math.PI) - 90}
                  draggable
                  onClick={() => selectShape(shape.id)}
                  onDragEnd={(e) => handleShapeDragEnd(e, shape.id)}
                  onTransformEnd={(e) => handleShapeTransformEnd(e, shape.id)}
                />
              );
            } else {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={Math.abs(shape.width)}
                  height={Math.abs(shape.height)}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  cornerRadius={shape.tool === 'comment' ? 10 : 0}
                  draggable
                  onClick={() => selectShape(shape.id)}
                  onDragEnd={(e) => handleShapeDragEnd(e, shape.id)}
                  onTransformEnd={(e) => handleShapeTransformEnd(e, shape.id)}
                />
              );
            }
          })}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;