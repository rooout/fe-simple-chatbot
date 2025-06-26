import App from '@/components/App'
import HealthCheck from '@/components/HealthCheck'

export default function Home() {
  return (
    <main className="h-screen">
      <App />
      <HealthCheck />
    </main>
  )
}
