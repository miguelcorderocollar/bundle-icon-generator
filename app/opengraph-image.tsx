import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "App Icon Generator";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#063940",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, #0b4f5a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #0b4f5a 2%, transparent 0%)",
        backgroundSize: "100px 100px",
      }}
    >
      {/* Main content container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        {/* Icon showcase */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "48px",
          }}
        >
          {/* Sample icon boxes */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              backgroundColor: "#03363D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #30AABC",
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="#30AABC"
                stroke="#30AABC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                fill="none"
                stroke="#30AABC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                fill="none"
                stroke="#30AABC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              backgroundColor: "#03363D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #8C50FF",
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#8C50FF"
                strokeWidth="2"
              />
              <path
                d="M12 6V12L16 14"
                fill="none"
                stroke="#8C50FF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              backgroundColor: "#03363D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #F79A3E",
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                fill="none"
                stroke="#F79A3E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                fill="none"
                stroke="#F79A3E"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "24px",
            textAlign: "center",
            lineHeight: "1.2",
          }}
        >
          App Icon Generator
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "32px",
            color: "#A0C4C9",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: "1.4",
          }}
        >
          Generate icon bundles for any platform with customizable colors,
          gradients, and one-click export
        </div>

        {/* Features badge */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "rgba(48, 170, 188, 0.2)",
              border: "2px solid #30AABC",
              borderRadius: "12px",
              color: "#30AABC",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            3,000+ Icons
          </div>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "rgba(140, 80, 255, 0.2)",
              border: "2px solid #8C50FF",
              borderRadius: "12px",
              color: "#8C50FF",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            Custom SVG Support
          </div>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "rgba(247, 154, 62, 0.2)",
              border: "2px solid #F79A3E",
              borderRadius: "12px",
              color: "#F79A3E",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            Local-First
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
