import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DistrictSnapshotCard } from '@/components/representatives/DistrictSnapshotCard'

const { useDistrictSnapshotMock } = vi.hoisted(() => ({
  useDistrictSnapshotMock: vi.fn(),
}))

vi.mock('@/hooks', () => ({
  useDistrictSnapshot: useDistrictSnapshotMock,
}))

describe('DistrictSnapshotCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDistrictSnapshotMock.mockReturnValue({
      loading: false,
      data: {
        districtName: 'Missouri - 02',
        population: 766000,
        medianAge: 38,
        nextElection: 'Nov 2026',
      },
    })
  })

  it('renders placeholder data when requested', () => {
    render(<DistrictSnapshotCard isPlaceholder />)
    expect(screen.getByText('Example')).toBeInTheDocument()
    expect(screen.getByText('Missouri - 02')).toBeInTheDocument()
    expect(screen.getByText('766k')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    useDistrictSnapshotMock.mockReturnValue({
      loading: true,
      data: null,
    })
    render(<DistrictSnapshotCard state="MO" district="02" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders fetched district data and errors', () => {
    useDistrictSnapshotMock.mockReturnValue({
      loading: false,
      data: {
        districtName: 'District 02',
        population: 1200000,
        medianAge: null,
        nextElection: null,
        error: 'Unable to load district data',
      },
    })

    render(<DistrictSnapshotCard state="MO" district="02" />)
    expect(screen.getByText('District 02')).toBeInTheDocument()
    expect(screen.getByText('1.2M')).toBeInTheDocument()
    expect(screen.getAllByText('N/A')).toHaveLength(2)
    expect(screen.getByText('Unable to load district data')).toBeInTheDocument()
  })
})
