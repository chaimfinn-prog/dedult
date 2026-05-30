/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
      },
      colors: {
        // ירוק דשא כצבע ראשי + מבטא חם (כתום/זהב)
        grass: {
          50: "#ecfdf3",
          100: "#d1fadf",
          200: "#a6f4c5",
          300: "#6ce9a6",
          400: "#32d583",
          500: "#12b76a",
          600: "#0b6b3a",
          700: "#08542d",
          800: "#063f22",
          900: "#042b17",
        },
        accent: {
          400: "#fdb022",
          500: "#f79009",
          600: "#dc6803",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.10)",
        lift: "0 12px 24px -8px rgba(6,63,34,0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        pop: "pop 0.18s ease-out both",
      },
    },
  },
  plugins: [],
};
