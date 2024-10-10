import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, RegularPolygon, Transformer, Text } from 'react-konva';
import { FaEraser, FaTrash, FaCircle, FaSquare, FaChevronRight } from 'react-icons/fa'; // Example icons
import { SketchPicker } from 'react-color';

const Canvas = () => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [selectedId, selectShape] = useState(null);
  const [text, setText] = useState('');
  const [textSize, setTextSize] = useState(20);
  const [editingText, setEditingText] = useState(null);
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
    if (e.target === e.target.getStage()) {
      selectShape(null);
      setEditingText(null);
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
        points: [pos.x, pos.y, pos.x, pos.y],
        color,
        strokeWidth,
      };
      setShapes([...shapes, newLine]);
    } else if (tool !== 'text') {
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
      const updatedPoints = [
        lastShape.points[0],
        lastShape.points[1],
        point.x,
        point.y,
      ];
      lastShape.points = updatedPoints;
      setShapes([...shapes.slice(0, -1), lastShape]);
    } else if (['square', 'rectangle', 'circle', 'triangle'].includes(tool)) {
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
    setStrokeWidth(parseInt(e.target.value, 10));
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleTextSizeChange = (e) => {
    setTextSize(parseInt(e.target.value, 10));
  };

  const handleTextSubmit = () => {
    if (text && stageRef.current) {
      const pos = stageRef.current.getPointerPosition();
      const newTextShape = {
        id: `shape_${shapes.length + 1}`,
        tool: 'text',
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
        text: text,
        fontSize: textSize,
        color,
      };
      setShapes([...shapes, newTextShape]);
      setText('');
    }
  };

  const handleTextEdit = (id) => {
    const textShape = shapes.find(shape => shape.id === id);
    if (textShape) {
      setEditingText(textShape);
      setText(textShape.text);
    }
  };

  const handleTextUpdate = () => {
    if (editingText) {
      const updatedShapes = shapes.map(shape => 
        shape.id === editingText.id ? { ...shape, text: text } : shape
      );
      setShapes(updatedShapes);
      setEditingText(null);
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (editingText) {
        handleTextUpdate();
      } else {
        handleTextSubmit();
      }
    }
  };

  const eraseShapes = (position) => {
    const eraserRadius = eraserSize / 2;
    
    const updatedShapes = shapes.filter((shape) => {
      if (shape.tool === 'line') {
        return !isPointNearLine(position, shape.points, eraserRadius);
      } else if (shape.tool === 'text') {
        return !isPointInsideRect(position, {
          x: shape.x,
          y: shape.y,
          width: shape.text.length * (shape.fontSize / 2),
          height: shape.fontSize
        }, eraserRadius);
      } else {
        return !isPointInsideRect(position, shape, eraserRadius);
      }
    });

    const updatedLines = lines.filter((line) => {
      return !isPointNearLine(position, line.points, eraserRadius);
    });

    setShapes(updatedShapes);
    setLines(updatedLines);
  };

  const isPointNearLine = (point, linePoints, threshold) => {
    for (let i = 0; i < linePoints.length - 2; i += 2) {
      const x1 = linePoints[i];
      const y1 = linePoints[i + 1];
      const x2 = linePoints[i + 2];
      const y2 = linePoints[i + 3];
      
      const distance = pointToLineDistance(point, {x: x1, y: y1}, {x: x2, y: y2});
      if (distance <= threshold) return true;
    }
    return false;
  };

  const pointToLineDistance = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointInsideRect = (point, rect, threshold) => {
    return (
      point.x >= rect.x - threshold &&
      point.x <= rect.x + Math.abs(rect.width) + threshold &&
      point.y >= rect.y - threshold &&
      point.y <= rect.y + Math.abs(rect.height) + threshold
    );
  };

  const resetCanvas = () => {
    setLines([]);
    setShapes([]);
    selectShape(null);
    setText('');
    setTextSize(20);
    setEditingText(null);
  };

  const handleDeleteShape = () => {
    if (selectedId) {
      const updatedShapes = shapes.filter(shape => shape.id !== selectedId);
      setShapes(updatedShapes);
      selectShape(null); // Deselect after deletion
    }
  };
  
  const toggleColorPicker = () => {
    setColorPickerVisible(!colorPickerVisible);
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-gray-100"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="mb-4 p-4 bg-white shadow-lg rounded-lg flex items-center space-x-4">
  <select
    className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out hover:border-blue-500"
    value={tool}
    onChange={(e) => setTool(e.target.value)}
  >
    <option value="pen">Pen</option>
    <option value="line">Line</option>
    <option value="rectangle">Rectangle</option>
    <option value="triangle">Triangle</option>
    <option value="circle">Circle</option>
    <option value="eraser">Eraser</option>
    <option value="select">Select</option>
  </select>
  <div className="mb-4 p-4 bg-white shadow-lg rounded-lg flex items-center space-x-4">
  {/* Color Picker */}
  <div className="flex items-center">
    <label className="mr-2 text-gray-700">Color:</label>
    <input
      className="w-10 h-10 rounded-full border border-gray-300 shadow-sm cursor-pointer transition duration-200 ease-in-out hover:border-blue-500 focus:outline-none focus:ring focus:ring-blue-300"
      type="color"
      value={color}
      onChange={handleColorChange}
    />
  </div>

  {/* Stroke Width Slider */}
  <div className="flex items-center">
    <label className="mr-2 text-gray-700">Stroke Width:</label>
    <input
      className="ml-2 appearance-none w-32 h-2 rounded-lg bg-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      type="range"
      min="1"
      max="50"
      value={strokeWidth}
      onChange={handleWidthChange}
    />
    <span className="ml-2 text-gray-700">{strokeWidth}px</span>
  </div>

  {/* Text Input */}
  <div className="flex items-center">
    <label className="mr-2 text-gray-700">Text:</label>
    <input
      className="ml-2 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
      type="text"
      value={text}
      placeholder="Enter text"
      onChange={handleTextChange}
    />
  </div>

  {/* Text Size Input */}
  <div className="flex items-center">
    <label className="mr-2 text-gray-700">Text Size:</label>
    <input
      className="ml-2 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
      type="number"
      min="10"
      max="100"
      value={textSize}
      onChange={handleTextSizeChange}
    />
  </div>
</div>

        <span className="ml-2">{textSize}px</span>
        <button
          className="ml-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
          onClick={editingText ? handleTextUpdate : handleTextSubmit}
        >
          {editingText ? 'Update Text' : 'Add Text'}
        </button>
        <button
          className="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
          onClick={resetCanvas}
        >
          Reset Canvas
        </button>

        <button
  className="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
  onClick={handleDeleteShape}
  disabled={!selectedId} // Disable the button if no shape is selected
>
  Delete Selected
</button>

      </div>
      <Stage
        width={1080}
        height={720}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        <Layer>
          {lines.map((line, index) => (
            <Line
              key={`line_${index}`}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
          {shapes.map((shape, index) => {
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
            } else if (shape.tool === 'rectangle') {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill="transparent"
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
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
                  radius={Math.abs(shape.width / 2)}
                  fill="transparent"
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  draggable
                  onClick={() => selectShape(shape.id)}
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
                  radius={Math.abs(shape.width / 2)}
                  fill="transparent"
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  draggable
                  onClick={() => selectShape(shape.id)}
                />
              );
            } else if (shape.tool === 'text') {
              return (
                <Text
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fontSize={shape.fontSize}
                  fill={shape.color}
                  draggable
                  onClick={() => handleTextEdit(shape.id)}
                />
              );
            }
            return null;
          })}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;