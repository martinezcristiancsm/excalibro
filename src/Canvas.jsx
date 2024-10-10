import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, RegularPolygon, Transformer } from 'react-konva';

const Canvas = () => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [selectedId, selectShape] = useState(null);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  useEffect(() => {
    if (selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
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
    // Deselect the shape if clicked on the stage (outside of shapes)
    if (e.target === stageRef.current) {
      selectShape(null);
    }

    const pos = e.target.getStage().getPointerPosition();

    if (tool === 'eraser') {
      eraseShapes(pos);
      return;
    }

    setIsDrawing(true);

    if (tool === 'pen') {
      setLines([...lines, { tool, points: [pos.x, pos.y], color, strokeWidth }]);
    } else if (tool === 'line') {
      const newLine = {
        id: `shape_${shapes.length + 1}`,
        tool: 'line',
        points: [pos.x, pos.y, pos.x, pos.y], // Start and end points are the same initially
        color,
        strokeWidth,
      };
      setShapes([...shapes, newLine]);
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
    } else if (tool === 'line') {
      let lastShape = shapes[shapes.length - 1];
      // Instead of appending points, we update the last 2 points (end coordinates)
      const updatedPoints = [
        lastShape.points[0], // x1 (start)
        lastShape.points[1], // y1 (start)
        point.x,             // x2 (end)
        point.y,             // y2 (end)
      ];
      lastShape.points = updatedPoints; // Update the points array with new end point
      setShapes([...shapes.slice(0, -1), lastShape]);
    } else if (tool === 'square' || tool === 'rectangle') {
      let lastShape = shapes[shapes.length - 1];
      lastShape.width = point.x - lastShape.x;
      lastShape.height = point.y - lastShape.y;
      setShapes([...shapes.slice(0, -1), lastShape]);
    } else if (tool === 'circle') {
      let lastShape = shapes[shapes.length - 1];
      lastShape.width = point.x - lastShape.x; // Width is used for diameter
      lastShape.height = point.y - lastShape.y;
      setShapes([...shapes.slice(0, -1), lastShape]);
    } else if (tool === 'triangle') {
      let lastShape = shapes[shapes.length - 1];
      lastShape.width = point.x - lastShape.x; // Set the width for triangle points
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

  const eraseShapes = (position) => {
    const updatedShapes = shapes.filter((shape) => {
      const isWithinBounds =
        position.x >= shape.x - eraserSize &&
        position.x <= shape.x + Math.abs(shape.width) + eraserSize &&
        position.y >= shape.y - eraserSize &&
        position.y <= shape.y + Math.abs(shape.height) + eraserSize;
      return !isWithinBounds;
    });

    const updatedLines = lines.filter((line) => {
      return !line.points.some((point, index) => {
        if (index % 2 === 0) {
          const x = point;
          const y = line.points[index + 1];
          return (
            x >= position.x - eraserSize &&
            x <= position.x + eraserSize &&
            y >= position.y - eraserSize &&
            y <= position.y + eraserSize
          );
        }
        return false;
      });
    });

    setShapes(updatedShapes);
    setLines(updatedLines);
  };

  const resetCanvas = () => {
    setLines([]);
    setShapes([]);
    selectShape(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="mb-4">
        <select className="p-2 border rounded" value={tool} onChange={(e) => setTool(e.target.value)}>
          <option value="pen">Pen</option>
          <option value="line">Line</option>
          <option value="square">Square</option>
          <option value="rectangle">Rectangle</option>
          <option value="triangle">Triangle</option>
          <option value="circle">Circle</option>
          <option value="eraser">Eraser</option>
        </select>
        <input className="ml-2 p-2 border rounded" type="color" value={color} onChange={handleColorChange} />
        <input
          className="ml-2 p-2 border rounded"
          type="range"
          min="1"
          max="50"
          value={strokeWidth}
          onChange={handleWidthChange}
        />
        <span className="ml-2">{strokeWidth}px</span>
        <button className="ml-2 p-2 bg-blue-500 text-white rounded" onClick={resetCanvas}>Reset Canvas</button>
      </div>
      <Stage
        width={1080}
        height={720}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {lines.map((line, index) => (
            <Line
              key={index}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              lineCap="round"
              lineJoin="round"
              draggable
              onClick={() => selectShape(`line_${index}`)}
            />
          ))}
          {shapes.map((shape) => {
            if (shape.tool === 'line') {
              return (
                <Line
                  key={shape.id}
                  id={shape.id}
                  points={shape.points}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  draggable
                  onClick={() => selectShape(shape.id)}
                />
              );
            } else if (shape.tool === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x + shape.width / 2}
                  y={shape.y + shape.height / 2}
                  radius={Math.max(shape.width, shape.height) / 2}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={null} // No fill for outlines
                  draggable
                  onClick={() => selectShape(shape.id)}
                />
              );
            } else if (shape.tool === 'rectangle') {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={null} // No fill for outlines
                  draggable
                  onClick={() => selectShape(shape.id)}
                />
              );
            } else if (shape.tool === 'square') {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.width} // Ensure width and height are the same for a square
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={null} // No fill for outlines
                  draggable
                  onClick={() => selectShape(shape.id)}
                />
              );
            } else if (shape.tool === 'triangle') {
              return (
                <RegularPolygon
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  sides={3}
                  radius={Math.max(shape.width, shape.height) / 2}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={null} // No fill for outlines
                  draggable
                  onClick={() => selectShape(shape.id)}
                />
              );
            }
            return null; // For any other cases
          })}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
