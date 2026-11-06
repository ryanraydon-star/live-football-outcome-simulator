import { NextRequest, NextResponse } from "next/server";

const fallbackWeather = {
  temperature: 16,
  humidity: 62,
  wind: 11,
  rain: 12,
  daylight: 68,
  summary: "Mild conditions",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat") ?? "53.438");
  const longitude = Number(searchParams.get("lon") ?? "-2.966");

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover&timezone=auto&forecast_days=1`;

  try {
    const response = await fetch(apiUrl, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(fallbackWeather);
    }

    const data = await response.json();
    const current = data?.current ?? {};
    const cloudCover = Number(current.cloud_cover ?? 30);
    const precipitation = Number(current.precipitation ?? 0);

    const weather = {
      temperature: Number(current.temperature_2m ?? fallbackWeather.temperature),
      humidity: Number(current.relative_humidity_2m ?? fallbackWeather.humidity),
      wind: Number(current.wind_speed_10m ?? fallbackWeather.wind),
      rain: Math.min(100, Math.max(0, precipitation * 30)),
      daylight: Math.max(0, Math.min(100, 100 - cloudCover)),
      summary:
        precipitation > 0
          ? "Light rain"
          : cloudCover > 65
            ? "Cloudy"
            : "Bright conditions",
    };

    return NextResponse.json(weather);
  } catch {
    return NextResponse.json(fallbackWeather);
  }
}
