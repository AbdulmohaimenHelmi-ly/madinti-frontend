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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }

          .card {
            background: white;
            border-radius: 24px;
            padding: 56px 48px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
            animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes pop {
            from { transform: scale(0.7); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }

          .face {
            font-size: 80px;
            line-height: 1;
            display: block;
            margin-bottom: 24px;
            animation: wiggle 1.2s ease-in-out infinite;
          }

          @keyframes wiggle {
            0%, 100% { transform: rotate(-8deg); }
            50%       { transform: rotate(8deg); }
          }

          h1 {
            font-size: 26px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 12px;
          }

          p {
            font-size: 15px;
            color: #666;
            line-height: 1.7;
            margin-bottom: 8px;
          }

          .heart {
            color: #e63946;
            display: inline-block;
            animation: heartbeat 1s ease-in-out infinite;
          }

          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.3); }
          }

          .back-btn {
            display: inline-block;
            margin-top: 32px;
            padding: 12px 32px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 15px;
            font-weight: 600;
            transition: transform 0.15s, box-shadow 0.15s;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
          }

          .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <span className="face">🙈</span>
          <h1>Oh, we caught you!</h1>
          <p>
            Looks like you opened the developer tools.<br />
            Please don&apos;t try to dig around — we&apos;ve got everything
            locked up tight <span className="heart">♥</span>
          </p>
          <p style={{ marginTop: "8px" }}>
            Close DevTools and come back, we promise the shop is
            way more fun than the source code.
          </p>
          <a href="/" className="back-btn">Take me back 🛍️</a>
        </div>
      </body>
    </html>
  );
}
