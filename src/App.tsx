import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { DefaultLayout } from '@/components/layout/DefaultLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { CompetitionPage } from '@/pages/CompetitionPage'
import { MatchListPage } from '@/pages/HomePage'

const MatchDetailPage = lazy(() =>
  import('@/pages/MatchDetailPage').then((m) => ({ default: m.MatchDetailPage })),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LayoutProvider>
          <DefaultLayout>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<CompetitionPage />} />
                <Route path="/competition/:providerId" element={<MatchListPage />} />
                <Route
                  path="/competition/:providerId/match/:id"
                  element={
                    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading…</div>}>
                      <MatchDetailPage />
                    </Suspense>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </DefaultLayout>
        </LayoutProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
