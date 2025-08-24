import React, { useEffect, useRef } from 'react';

// Default SMILES and SVG as per user example
{/* <svg data-smiles="C=CCBr.[Na+].[I-]>CC(=O)C>C=CCI.[Na+].[Br-]  __{'textBelowArrow': '90%'}__"></svg> */ }
const DEFAULT_SVG = ``;

const SmilesRenderer = ({ smiles, svg = DEFAULT_SVG, width = 250, height = 250 }) => {
  const svgContainerRef = useRef(null);
  const canvasRef = useRef(null);
  // Generate a unique id per instance
  const idRef = useRef(`smiles-canvas-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Dynamically load SMILES-Drawer if not present
    const scriptId = 'smiles-drawer-script';
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.SmiDrawer) {
          resolve();
          return;
        }
        // let script = document.getElementById(scriptId);
        // if (!script) {
        //   script = document.createElement('script');
        //   script.id = scriptId;
        //   script.src = 'https://unpkg.com/smiles-drawer@2.0.1/dist/smiles-drawer.min.js';
        //   script.onload = resolve;
        //   script.onerror = reject;
        //   document.body.appendChild(script);
        // } else {
        //   script.onload = resolve;
        // }
      });
    };

    loadScript().then(() => {
      const SmiDrawer = window.SmiDrawer;
      if (!SmiDrawer) return;

      // Create a new drawer instance (v2.x API)
      const drawer = new SmiDrawer({ width, height });

      // Draw the SMILES using the unique id selector
      try {
        drawer.draw(smiles, `#${idRef.current}`, 'light', false);
      } catch (err) {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, width, height);
          ctx.font = "20px Arial";
          ctx.fillStyle = "red";
          ctx.fillText("Invalid SMILES", 10, 50);
        }
      }
    });

    // Render SVG below the molecule
    if (svgContainerRef.current) {
      // svgContainerRef.current.innerHTML = svg;
    }
  }, [smiles, svg, width, height]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        id={idRef.current}
        width={width}
        height={height}
        //  border: '1px solid #ccc',
        style={{ display: 'block', margin: '0 auto' }}
        data-smiles={smiles}
      />
      {/* <div ref={svgContainerRef} style={{}} /> */}
    </div>
  );
};

export default SmilesRenderer;
