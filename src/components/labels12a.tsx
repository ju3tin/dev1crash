import { useEffect, useRef } from 'react'; // Imports React hooks for effect handling and DOM reference
import * as d3 from 'd3'; // Imports all D3.js modules for charting and animation
import { Selection, Line } from 'd3'; // Imports specific D3 types for type safety

// Interface for Bezier curve data points
interface CurvePoint {
    t: number; // Time value for x-axis
    value: number; // Value for y-axis
}

// Interface for SVG margin configuration
interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export default function BezierCurve() { // Defines a React functional component
    const svgRef = useRef<SVGSVGElement | null>(null); // Ref for SVG element with TypeScript type

    useEffect(() => { // Runs D3 rendering after component mounts
        if (!svgRef.current) return; // Guards against null ref

        // SVG Setup
        const svg: Selection<SVGSVGElement, unknown, null, undefined> = d3.select(svgRef.current); // Selects SVG with typed D3 selection
        const svgElement = svgRef.current;
        const width: number = svgElement.clientWidth || 400; // Uses actual SVG width or fallback to 400px
        const height: number = svgElement.clientHeight || 200; // Uses actual SVG height or fallback to 200px
        const margin: Margin = { top: 0, right: 0, bottom: 20, left: 20 }; // Defines margins with typed interface
        const innerWidth: number = width - margin.left - margin.right; // Calculates inner chart width (280px)
        const innerHeight: number = height - margin.top - margin.bottom; // Calculates inner chart height (100px)

        const g: Selection<SVGGElement, unknown, null, undefined> = svg.append("g") // Appends a <g> group for chart content
            .attr("transform", `translate(${margin.left},${margin.top})`); // Translates group by (70,40) for margins

        // Scales
        let x = d3.scaleLinear() // Creates linear scale for x-axis (time)
            .domain([0, 10]) // Sets initial x-domain from 0 to 10
            .range([0, innerWidth]); // Maps to pixel range 0 to 280px

        let y = d3.scaleLinear() // Creates linear scale for y-axis (value)
            .domain([2, 2]) // Sets initial y-domain from 0 to 5
            .range([innerHeight, 0]); // Maps to pixel range 100px to 0 (inverted)

        // Axes Groups
        const xAxisGroup: Selection<SVGGElement, unknown, null, undefined> = g.append("g") // Appends <g> for x-axis
            .attr("class", "x-axis") // Assigns class "x-axis" for styling
            .attr("transform", `translate(0,${innerHeight})`); // Moves x-axis to bottom (y=100px)

        const yAxisGroup: Selection<SVGGElement, unknown, null, undefined> = g.append("g") // Appends <g> for y-axis
            .attr("class", "y-axis"); // Assigns class "y-axis" for styling

        // Initial Axes
        xAxisGroup.call(d3.axisBottom(x).tickValues([2, 4, 6, 8]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Renders x-axis with ticks 0-8
        yAxisGroup.call(d3.axisLeft(y).tickValues([]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Renders y-axis with ticks 0-5

      //  xAxisGroup.call(d3.axisBottom(x).tickValues(d3.range(0, 9))); // Renders x-axis with ticks 0-8
      //  yAxisGroup.call(d3.axisLeft(y).tickValues(d3.range(0, 6))); // Renders y-axis with ticks 0-5


        
        // Bezier Curve Path Generator
        const line: Line<CurvePoint> = d3.line<CurvePoint>() // Creates typed D3 line generator
            .x(d => x(d.t)) // Maps 't' to x-coordinate
            .y(d => y(d.value)) // Maps 'value' to y-coordinate
            .curve(d3.curveBasis); // Applies Bezier smoothing

        // Generate Data
        function generateData(xDomain: [number, number], yDomain: [number, number]): CurvePoint[] { // Typed function for data generation
            const [xMin, xMax] = xDomain; // Destructures x-domain
            const [yMin, yMax] = yDomain; // Destructures y-domain
            const yMid: number = (yMin + yMax) / 2; // Calculates y midpoint
            const yAmp: number = (yMax - yMin) / 2 * 0.8; // Sets amplitude as 80% of y-range
            return d3.range(xMin, xMax + 0.1, 0.1).map(t => ({ // Creates array of CurvePoint objects
                t, // Time value
                value: yMid + yAmp * Math.sin(t * Math.PI / 4) // Sine wave for y-value
            }));
        }

        let data: CurvePoint[] = generateData([0, 10], [0, 5]); // Generates initial data

        // Path Tween for Curve Animation
        function pathTween(this: SVGPathElement): (t: number) => string { // Typed path tween function
            const l: number = this.getTotalLength(); // Gets path length
            const i = d3.interpolateString(`M0,${y(0)}L${innerWidth},${y(0)}`, this.getAttribute("d") || ""); // Interpolates from flat line
            return t => { // Computes path at time t
                if (t < 0.5) { // First 50% of animation
                    const p = this.getPointAtLength(t * 2 * l); // Gets point along path
                    return `M0,${y(0)}L${p.x},${p.y}`; // Draws line to current point
                } else { // Second 50%
                    return i((t - 0.5) * 2); // Interpolates to full path
                }
            };
        }

        // Draw Initial Curve
        const path = g.append("path") // Appends typed path for Bezier curve
            .datum(data) // Binds initial data
            .attr("fill", "none") // Sets no fill
           // .attr("stroke", "steelblue") // Sets line color
            .attr("stroke", "none")
            .attr("stroke-width", 0) // Sets line thickness
            .attr("d", `M0,${y(0)}L${innerWidth},${y(0)}`); // Sets initial flat line

        // Add SVG Image at Curve Endpoint (Inline SVG Circle)
        const endpointImage: Selection<SVGCircleElement, unknown, null, undefined> = g.append("circle") // Appends typed circle for endpoint
            .attr("cx", x(data[data.length - 1].t)) // Sets initial x-position
            .attr("cy", y(data[data.length - 1].value)) // Sets initial y-position
            .attr("r", 0) // Sets radius to 5px
            .attr("fill", "none"); // Sets fill color

        // Animation Sequence
        function phase0() { // Defines Phase 1 of animation
            console.log("Phase 1: X 0-8 full, Y 0-5 full, Curve grows"); // Logs phase start
            x.domain([0, 10]); // Sets x-domain to 0-10
            y.domain([0, 2]); // Sets y-domain to 0-5
            data = generateData([0, 10], [0, 5]); // Generates new data

            xAxisGroup.transition().duration(9500) // Starts 500ms x-axis transition
                .call(d3.axisBottom(x).tickValues([2, 4, 6, 8]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(9500) // Starts 500ms y-axis transition
                .call(d3.axisLeft(y).tickValues([]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data to path
                .transition() // Starts path transition
                .duration(500) // Sets duration
                .attrTween("d", pathTween); // Animates path shape

            endpointImage.transition() // Starts circle transition
                .duration(500) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase1, 9500); // Schedules Phase 2
        }


        function phase1() { // Defines Phase 1 of animation
            console.log("Phase 1: X 0-8 full, Y 0-5 full, Curve grows"); // Logs phase start
            x.domain([0, 10]); // Sets x-domain to 0-10
            y.domain([0, 2]); // Sets y-domain to 0-5
            data = generateData([0, 10], [0, 5]); // Generates new data

            xAxisGroup.transition().duration(500) // Starts 500ms x-axis transition
                .call(d3.axisBottom(x).tickValues([2, 4, 6, 8, 10]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(500) // Starts 500ms y-axis transition
                .call(d3.axisLeft(y).tickValues([2]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data to path
                .transition() // Starts path transition
                .duration(500) // Sets duration
                .attrTween("d", pathTween); // Animates path shape

            endpointImage.transition() // Starts circle transition
                .duration(500) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase2, 500); // Schedules Phase 2
        }

        function phase2() { // Defines Phase 2
            console.log("Phase 2: X slide left (0,6), Y slide up (1,6), Curve regrows"); // Logs phase
            x.domain([0, 20]); // Sets x-domain (slides left)
            y.domain([1, 4]); // Sets y-domain (slides up)
            data = generateData([0, 6], [1, 6]); // Generates new data

            xAxisGroup.transition().duration(10000) // Starts 2s x-axis transition
                .call(d3.axisBottom(x).tickValues([0, 10, 20]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(10000) // Starts 2s y-axis transition
                .call(d3.axisLeft(y).tickValues([2, 3, 4]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data
                .transition() // Starts path transition
                .duration(2000) // Sets duration
                .attrTween("d", pathTween); // Animates path

            endpointImage.transition() // Starts circle transition
                .duration(2000) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase3, 10000); // Schedules Phase 3
        }

        function phase3() { // Defines Phase 3
            console.log("Phase 3: X sparse 0-10, Y sparse 0-10, Curve regrows"); // Logs phase
            x.domain([0, 30]); // Sets x-domain
            y.domain([1, 8]); // Sets y-domain
            data = generateData([0, 10], [0, 10]); // Generates new data

            xAxisGroup.transition().duration(10000) // Starts 1s x-axis transition
                .call(d3.axisBottom(x).tickValues([0, 10, 20, 30]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates sparse ticks
            yAxisGroup.transition().duration(10000) // Starts 1s y-axis transition
                .call(d3.axisLeft(y).tickValues([2, 6, 8]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates sparse ticks

            path.datum(data) // Binds new data
                .transition() // Starts path transition
                .duration(1000) // Sets duration
                .attrTween("d", pathTween); // Animates path

            endpointImage.transition() // Starts circle transition
                .duration(1000) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase4, 10000); // Schedules Phase 1 (loop)
        }

        function phase4() { // Defines Phase 4
            console.log("Phase 2: X slide left (0,6), Y slide up (1,6), Curve regrows"); // Logs phase
            x.domain([0, 40]); // Sets x-domain (slides left)
            y.domain([1, 16]); // Sets y-domain (slides up)
            data = generateData([0, 6], [1, 6]); // Generates new data

            xAxisGroup.transition().duration(10000) // Starts 2s x-axis transition
                .call(d3.axisBottom(x).tickValues([0, 10, 20, 30, 40]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(10000) // Starts 2s y-axis transition
                .call(d3.axisLeft(y).tickValues([4, 8, 16]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data
                .transition() // Starts path transition
                .duration(2000) // Sets duration
                .attrTween("d", pathTween); // Animates path

            endpointImage.transition() // Starts circle transition
                .duration(2000) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase5, 10000); // Schedules Phase 3
        }

        function phase5() { // Defines Phase 5
            console.log("Phase 2: X slide left (0,6), Y slide up (1,6), Curve regrows"); // Logs phase
            x.domain([0, 50]); // Sets x-domain (slides left)
            y.domain([1, 32]); // Sets y-domain (slides up)
            data = generateData([0, 6], [1, 6]); // Generates new data

            xAxisGroup.transition().duration(10000) // Starts 2s x-axis transition
                .call(d3.axisBottom(x).tickValues([0, 10, 20, 30, 40, 50]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(10000) // Starts 2s y-axis transition
                .call(d3.axisLeft(y).tickValues([16, 24, 32]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data
                .transition() // Starts path transition
                .duration(2000) // Sets duration
                .attrTween("d", pathTween); // Animates path

            endpointImage.transition() // Starts circle transition
                .duration(2000) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase6, 10000); // Schedules Phase 3
        }

        function phase6() { // Defines Phase 6
            console.log("Phase 2: X slide left (0,6), Y slide up (1,6), Curve regrows"); // Logs phase
            x.domain([0, 60]); // Sets x-domain (slides left)
            y.domain([1, 64]); // Sets y-domain (slides up)
            data = generateData([0, 6], [1, 6]); // Generates new data

            xAxisGroup.transition().duration(10000) // Starts 2s x-axis transition
                .call(d3.axisBottom(x).tickValues([0, 10, 20, 30, 40, 50, 60]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(10000) // Starts 2s y-axis transition
                .call(d3.axisLeft(y).tickValues([24, 32, 64]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data
                .transition() // Starts path transition
                .duration(2000) // Sets duration
                .attrTween("d", pathTween); // Animates path

            endpointImage.transition() // Starts circle transition
                .duration(2000) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase7, 10000); // Schedules Phase 3
        }

        function phase7() { // Defines Phase 7
            console.log("Phase 2: X slide left (0,6), Y slide up (1,6), Curve regrows"); // Logs phase
            x.domain([0, 70]); // Sets x-domain (slides left)
            y.domain([1, 128]); // Sets y-domain (slides up)
            data = generateData([0, 6], [1, 6]); // Generates new data

            xAxisGroup.transition().duration(10000) // Starts 2s x-axis transition
                .call(d3.axisBottom(x).tickValues([0, 10, 20, 30, 40, 50, 60, 70]).tickFormat(d3.format('d')).tickSizeOuter(0)); // Updates x-axis ticks
            yAxisGroup.transition().duration(10000) // Starts 2s y-axis transition
                .call(d3.axisLeft(y).tickValues([64, 96, 128]).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0)); // Updates y-axis ticks

            path.datum(data) // Binds new data
                .transition() // Starts path transition
                .duration(2000) // Sets duration
                .attrTween("d", pathTween); // Animates path

            endpointImage.transition() // Starts circle transition
                .duration(2000) // Matches duration
                .attr("cx", x(data[data.length - 1].t)) // Moves to new x
                .attr("cy", y(data[data.length - 1].value)); // Moves to new y

            setTimeout(phase1, 10000); // Schedules Phase 3
        }

        // Start Animation
        phase0(); // Initiates animation

        // Handle window resize
        const handleResize = () => {
            if (!svgRef.current) return;
            
            const newWidth = svgRef.current.clientWidth || 400;
            const newHeight = svgRef.current.clientHeight || 200;
            
            // Update SVG dimensions
            svg.attr("width", newWidth).attr("height", newHeight);
            
            // Update scales with new dimensions
            const newInnerWidth = newWidth - margin.left - margin.right;
            const newInnerHeight = newHeight - margin.top - margin.bottom;
            
            x.range([0, newInnerWidth]);
            y.range([newInnerHeight, 0]);
            
            // Update axes
            xAxisGroup.attr("transform", `translate(0,${newInnerHeight})`);
            xAxisGroup.call(d3.axisBottom(x).tickValues(d3.range(0, 9)).tickFormat(d3.format('d')).tickSizeOuter(0));
            yAxisGroup.call(d3.axisLeft(y).tickValues(d3.range(0, 6)).tickFormat((d: d3.NumberValue, _i: number) => `${Number(d)}x`).tickSizeOuter(0));
            
            // Update path
            path.attr("d", line(data));
            
            // Update endpoint
            endpointImage
                .attr("cx", x(data[data.length - 1].t))
                .attr("cy", y(data[data.length - 1].value));
        };

        // Add resize listener
        window.addEventListener('resize', handleResize);

        // Cleanup on unmount
        return () => { // Cleanup function
            window.removeEventListener('resize', handleResize);
            svg.selectAll("*").remove(); // Removes SVG children to prevent leaks
        };
    }, []); // Empty dependency array for single run

    return ( // Renders JSX
        <>
         <style jsx>{` /* Scoped styles */
                svg {
                   
             
                }
                .axis-label {
                    font-size: 12px;
                    fill: #333;
                }
                .title {
                    font-size: 16px;
                    font-weight: bold;
                    fill: #333;
                }
            `}</style> {/* Closes inline styles */}
            <svg ref={svgRef} className="w-full h-full" // Makes canvas fill its container
            style={{
                backgroundColor: 'transparent',
              zIndex: 90, // Ensures canvas is above other elements
            }}></svg> {/* SVG with typed ref */}
     </>
    );
}