import React, { useEffect, useState } from 'react';

const FlyingBirds: React.FC = () => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; key: string }>>([]);

  useEffect(() => {
    let sparkleId = 0;
    
    const createSparkle = () => {
      if (Math.random() < 0.3) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const id = sparkleId++;
        const key = `sparkle-${id}-${Date.now()}`;
        
        setSparkles(prev => [...prev, { id, x, y, key }]);
        
        setTimeout(() => {
          setSparkles(prev => prev.filter(sparkle => sparkle.id !== id));
        }, 1000);
      }
    };

    const sparkleInterval = setInterval(createSparkle, 500);
    
    return () => {
      clearInterval(sparkleInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {/* CSS Styles */}
      <style>{`
        .bird {
          background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/174479/bird-cells-new.svg');
          filter: hue-rotate(320deg) saturate(300%) brightness(1.2) contrast(1.5) drop-shadow(0 0 8px #ff0040);
          background-size: auto 100%;
          width: 135px;
          height: 190px;
          will-change: background-position;
          animation-name: fly-cycle;
          animation-timing-function: steps(10);
          animation-iteration-count: infinite;
        }

        .bird-one {
          animation-duration: 1s;
          animation-delay: -0.5s;
        }

        .bird-two { 
          animation-duration: 0.9s; 
          animation-delay: -0.75s; 
        }

        .bird-three {
          animation-duration: 1.25s;
          animation-delay: -0.25s;
        }

        .bird-four {
          animation-duration: 1.1s;
          animation-delay: -0.5s;
        }

        .bird-five {
          animation-duration: 1.15s;
          animation-delay: -0.3s;
        }

        .bird-six {
          animation-duration: 0.95s;
          animation-delay: -0.8s;
        }

        .bird-seven {
          animation-duration: 1.05s;
          animation-delay: -0.6s;
        }

        .bird-eight {
          animation-duration: 0.85s;
          animation-delay: -0.9s;
        }

        /* Birds flying right to left need to be flipped */
        .bird-rtl {
          transform: scaleX(-1);
        }

        .bird-container {
          position: absolute;
          transform: scale(0) translateX(-10vw);
          will-change: transform;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .bird-container-one {
          top: 15%;
          left: -3%;
          animation-name: fly-right-top;
          animation-duration: 15s;
          animation-delay: 0;
        }

        .bird-container-two {
          top: 60%;
          left: -3%;
          animation-name: fly-right-bottom;
          animation-duration: 16s;
          animation-delay: 1s;
        }

        .bird-container-three {
          top: 35%;
          left: -3%;
          animation-name: fly-right-middle;
          animation-duration: 14.6s;
          animation-delay: 9.5s;
        }

        .bird-container-four {
          top: 80%;
          left: -3%;
          animation-name: fly-right-low;
          animation-duration: 16s;
          animation-delay: 10.25s;
        }

        .bird-container-five {
          top: 5%;
          left: -3%;
          animation-name: fly-right-high;
          animation-duration: 17s;
          animation-delay: 5s;
        }

        .bird-container-six {
          top: 50%;
          left: -3%;
          animation-name: fly-diagonal;
          animation-duration: 15.5s;
          animation-delay: 13s;
        }

        /* Right to Left Birds */
        .bird-container-seven {
          top: 25%;
          right: -3%;
          animation-name: fly-left-top;
          animation-duration: 17s;
          animation-delay: 3s;
        }

        .bird-container-eight {
          top: 70%;
          right: -3%;
          animation-name: fly-left-bottom;
          animation-duration: 16s;
          animation-delay: 7s;
        }

        @keyframes fly-cycle {
          100% {
            background-position: -1400px 0;
          }
        }

        @keyframes fly-right-top {
          0% {
            transform: scale(0.3) translateX(-10vw);
          }
          10% {
            transform: translateY(-2vh) translateX(10vw) scale(0.4);
          }
          20% {
            transform: translateY(1vh) translateX(30vw) scale(0.5);
          }
          30% {
            transform: translateY(-1vh) translateX(50vw) scale(0.6);
          }
          40% {
            transform: translateY(2vh) translateX(70vw) scale(0.6);
          }
          50% {
            transform: translateY(0vh) translateX(90vw) scale(0.6);
          }
          60% {
            transform: translateY(-1vh) translateX(110vw) scale(0.6);
          }
          100% {
            transform: translateY(-1vh) translateX(110vw) scale(0.6);
          }
        }

        @keyframes fly-right-bottom {
          0% {
            transform: scale(0.3) translateX(-10vw);
          }
          10% {
            transform: translateY(3vh) translateX(10vw) scale(0.4);
          }
          20% {
            transform: translateY(-2vh) translateX(30vw) scale(0.5);
          }
          30% {
            transform: translateY(1vh) translateX(50vw) scale(0.6);
          }
          40% {
            transform: translateY(-1vh) translateX(70vw) scale(0.6);
          }
          50% {
            transform: translateY(2vh) translateX(90vw) scale(0.6);
          }
          60% {
            transform: translateY(0vh) translateX(110vw) scale(0.6);
          }
          100% {
            transform: translateY(0vh) translateX(110vw) scale(0.6);
          }
        }

        @keyframes fly-right-middle {
          0% {
            transform: scale(0.3) translateX(-10vw);
          }
          10% {
            transform: translateY(2vh) translateX(10vw) scale(0.4);
          }
          20% {
            transform: translateY(-3vh) translateX(30vw) scale(0.5);
          }
          30% {
            transform: translateY(4vh) translateX(50vw) scale(0.6);
          }
          40% {
            transform: translateY(-1vh) translateX(70vw) scale(0.6);
          }
          50% {
            transform: translateY(1vh) translateX(90vw) scale(0.6);
          }
          60% {
            transform: translateY(-2vh) translateX(110vw) scale(0.6);
          }
          100% {
            transform: translateY(-2vh) translateX(110vw) scale(0.6);
          }
        }

        @keyframes fly-right-low {
          0% {
            transform: scale(0.3) translateX(-10vw);
          }
          10% {
            transform: translateY(-4vh) translateX(10vw) scale(0.4);
          }
          20% {
            transform: translateY(2vh) translateX(30vw) scale(0.5);
          }
          30% {
            transform: translateY(-3vh) translateX(50vw) scale(0.6);
          }
          40% {
            transform: translateY(1vh) translateX(70vw) scale(0.6);
          }
          50% {
            transform: translateY(-1vh) translateX(90vw) scale(0.6);
          }
          60% {
            transform: translateY(2vh) translateX(110vw) scale(0.6);
          }
          100% {
            transform: translateY(2vh) translateX(110vw) scale(0.6);
          }
        }

        @keyframes fly-right-high {
          0% {
            transform: scale(0.3) translateX(-10vw);
          }
          10% {
            transform: translateY(1vh) translateX(10vw) scale(0.4);
          }
          20% {
            transform: translateY(-1vh) translateX(30vw) scale(0.5);
          }
          30% {
            transform: translateY(3vh) translateX(50vw) scale(0.6);
          }
          40% {
            transform: translateY(-2vh) translateX(70vw) scale(0.6);
          }
          50% {
            transform: translateY(0vh) translateX(90vw) scale(0.6);
          }
          60% {
            transform: translateY(1vh) translateX(110vw) scale(0.6);
          }
          100% {
            transform: translateY(1vh) translateX(110vw) scale(0.6);
          }
        }

        @keyframes fly-diagonal {
          0% {
            transform: scale(0.3) translateX(-10vw);
          }
          10% {
            transform: translateY(-8vh) translateX(10vw) scale(0.4);
          }
          20% {
            transform: translateY(-12vh) translateX(30vw) scale(0.5);
          }
          30% {
            transform: translateY(-10vh) translateX(50vw) scale(0.6);
          }
          40% {
            transform: translateY(-15vh) translateX(70vw) scale(0.6);
          }
          50% {
            transform: translateY(-18vh) translateX(90vw) scale(0.6);
          }
          60% {
            transform: translateY(-20vh) translateX(110vw) scale(0.6);
          }
          100% {
            transform: translateY(-20vh) translateX(110vw) scale(0.6);
          }
        }

        /* Right to Left Flight Patterns */
        @keyframes fly-left-top {
          0% {
            transform: scale(0.3) translateX(10vw);
          }
          10% {
            transform: translateY(-1vh) translateX(-10vw) scale(0.4);
          }
          20% {
            transform: translateY(2vh) translateX(-30vw) scale(0.5);
          }
          30% {
            transform: translateY(-2vh) translateX(-50vw) scale(0.6);
          }
          40% {
            transform: translateY(1vh) translateX(-70vw) scale(0.6);
          }
          50% {
            transform: translateY(-1vh) translateX(-90vw) scale(0.6);
          }
          60% {
            transform: translateY(0vh) translateX(-110vw) scale(0.6);
          }
          100% {
            transform: translateY(0vh) translateX(-110vw) scale(0.6);
          }
        }

        @keyframes fly-left-bottom {
          0% {
            transform: scale(0.3) translateX(10vw);
          }
          10% {
            transform: translateY(2vh) translateX(-10vw) scale(0.4);
          }
          20% {
            transform: translateY(-3vh) translateX(-30vw) scale(0.5);
          }
          30% {
            transform: translateY(3vh) translateX(-50vw) scale(0.6);
          }
          40% {
            transform: translateY(-1vh) translateX(-70vw) scale(0.6);
          }
          50% {
            transform: translateY(2vh) translateX(-90vw) scale(0.6);
          }
          60% {
            transform: translateY(-1vh) translateX(-110vw) scale(0.6);
          }
          100% {
            transform: translateY(-1vh) translateX(-110vw) scale(0.6);
          }
        }

        @keyframes sparkle {
          0% { 
            opacity: 0; 
            transform: scale(0) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1) rotate(180deg); 
          }
          100% { 
            opacity: 0; 
            transform: scale(0) rotate(360deg); 
          }
        }

        .sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ff0040;
          border-radius: 50%;
          box-shadow: 0 0 10px #ff0040;
          pointer-events: none;
          animation: sparkle 1s ease-out forwards;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .bird {
            width: 95px;
            height: 135px;
          }
          
          .bird-container {
            animation-duration: 20s;
          }
          
          .bird-container-two,
          .bird-container-four {
            animation-duration: 22s;
          }

          /* Mobile-specific positioning - more birds towards top */
          .bird-container-one {
            top: 8%;
          }

          .bird-container-two {
            top: 25%;
          }

          .bird-container-three {
            top: 15%;
          }

          .bird-container-four {
            top: 40%;
          }

          .bird-container-five {
            top: 2%;
          }

          .bird-container-six {
            top: 20%;
          }

          .bird-container-seven {
            top: 12%;
          }

          .bird-container-eight {
            top: 30%;
          }

          @keyframes fly-cycle {
            100% {
              background-position: -960px 0;
            }
          }
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .bird-container {
            animation-duration: 40s;
          }
          
          .bird-container-two,
          .bird-container-four {
            animation-duration: 45s;
          }
          
          .bird {
            animation-duration: 2s;
          }
        }
      `}</style>

      {/* Flying Birds */}
      <div className="bird-container bird-container-one">
        <div className="bird bird-one"></div>
      </div>
      
      <div className="bird-container bird-container-two">
        <div className="bird bird-two"></div>
      </div>
      
      <div className="bird-container bird-container-three">
        <div className="bird bird-three"></div>
      </div>
      
      <div className="bird-container bird-container-four">
        <div className="bird bird-four"></div>
      </div>
      
      <div className="bird-container bird-container-five">
        <div className="bird bird-five"></div>
      </div>
      
      <div className="bird-container bird-container-six">
        <div className="bird bird-six"></div>
      </div>
      
      <div className="bird-container bird-container-seven">
        <div className="bird bird-rtl bird-seven"></div>
      </div>
      
      <div className="bird-container bird-container-eight">
        <div className="bird bird-rtl bird-eight"></div>
      </div>

      {/* Dynamic Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.key}
          className="sparkle"
          style={{
            left: sparkle.x + 'px',
            top: sparkle.y + 'px',
          }}
        />
      ))}
    </div>
  );
};

export default FlyingBirds;
