export default function HackerPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hey there 👀</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0d0f1a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
          }

          /* Subtle animated grid lines */
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background-image:
              linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
            background-size: 48px 48px;
            pointer-events: none;
          }

          /* Top glow */
          body::after {
            content: "";
            position: fixed;
            top: -200px;
            left: 50%;
            transform: translateX(-50%);
            width: 700px;
            height: 400px;
            background: radial-gradient(ellipse, rgba(56, 189, 248, 0.12) 0%, transparent 70%);
            pointer-events: none;
          }

          .card {
            position: relative;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 20px;
            padding: 56px 48px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 0 60px rgba(56, 189, 248, 0.06), 0 24px 48px rgba(0,0,0,0.5);
            backdrop-filter: blur(16px);
            animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes pop {
            from { transform: scale(0.75); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }

          .face {
            font-size: 82px;
            line-height: 1;
            display: block;
            margin-bottom: 24px;
            animation: sweat 1.6s ease-in-out infinite;
          }

          @keyframes sweat {
            0%, 100% { transform: translateY(0) rotate(-4deg); }
            50%       { transform: translateY(-6px) rotate(4deg); }
          }

          h1 {
            font-size: 26px;
            font-weight: 700;
            color: #f0f4ff;
            margin-bottom: 12px;
            letter-spacing: -0.3px;
          }

          p {
            font-size: 14.5px;
            color: rgba(180, 200, 240, 0.7);
            line-height: 1.75;
            margin-bottom: 8px;
          }

          .highlight {
            color: #38bdf8;
          }

          .back-btn {
            display: inline-block;
            margin-top: 32px;
            padding: 12px 32px;
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.35);
            color: #38bdf8;
            text-decoration: none;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
            transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          }

          .back-btn:hover {
            background: rgba(56, 189, 248, 0.22);
            box-shadow: 0 0 24px rgba(56, 189, 248, 0.25);
            transform: translateY(-2px);
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <span className="face">😅</span>
          <h1>Oh, we caught you!</h1>
          <p>
            Looks like you opened the developer tools.<br />
            Please don&apos;t try to dig around —{" "}
            <span className="highlight">we&apos;ve got everything locked up tight.</span>
          </p>
          <p>
            Close DevTools and come back, we promise the shop is
            way more fun than the source code.
          </p>
          <a href="/" className="back-btn">Take me back 🛍️</a>
        </div>
      </body>
    </html>
  );
}
