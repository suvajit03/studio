import ForecastPage from "@/components/forecast/forecast-page";
import { UserProvider } from "@/components/providers/user-provider";

export default function Forecast() {
    return (
        <UserProvider>
            <ForecastPage />
        </UserProvider>
    )
}