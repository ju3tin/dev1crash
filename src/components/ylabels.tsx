type Props = {
    currentMultiplier: number;
    timer5: number;
    canvasheight: number | undefined;
    canvaswidth: number | undefined;
  };
  
  export default function YLabels({ currentMultiplier, timer5, canvasheight, canvaswidth }: Props) {
    // Define arrays for each multiplier range with a time property (in seconds)
    const ranges = [
      { min: 1.0, max: 2.60, values: [2, 4, 6, 8, 10, 12], time: 10 },
      { min: 2.61, max: 100.0, values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], time: 70 },
     
    ];
  
    // Find the matching range for currentMultiplier
    const currentRange = ranges.find(
      (range) => currentMultiplier > range.min && currentMultiplier < range.max
    );
  
    // Inverted spacing logic — more time = more spacing, less time = tighter
    const time = currentRange?.time || timer5;
    const baseSpacing = 30; // Max spacing when time is longest
    const invertedSpacing = baseSpacing / time; // e.g. 30/5 = 6px, 30/1 = 30px
  
    return (
      <>
        <span
          style={{
            top: "200px",
            left: "0%",
            transform: "translateX(-50%)",
            position: "absolute",
            fontSize: "1.5rem",
            zIndex: 10,
            animation: `moveHorizontally ${time}s linear infinite`,
          }}
        >
          <style>
            {`
              @keyframes moveHorizontally {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(calc(50% + 100px)); }
              }
            `}
          </style>
  
          {currentRange && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                position: "absolute",
                zIndex: 11,
              }}
            >
              {currentRange.values.map((value, index) => (
                <li
                  key={value}
                  style={{
                    marginRight: `${invertedSpacing}px`,
                  }}
                >
                  {value}{/* {canvasheight} {canvaswidth} */}
                </li>
              ))}
            </ul>
          )}
        </span>
  
        <div className="vertical-line" style={{ width: "1px", height: "200px", backgroundColor: "white" }}></div>

  
        {console.log(timer5 + " timer5 this is it dude")}
      </>
    );
  }
  