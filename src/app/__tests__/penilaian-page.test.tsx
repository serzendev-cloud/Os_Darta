import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import PenilaianPage from "../dashboard/penilaian/page"

describe("PenilaianPage Responsive Assessment Entry Component Tests", () => {
  it("should render PenilaianPage header and title correctly", () => {
    render(<PenilaianPage />)
    expect(screen.getByText("Penilaian & Evaluasi Akademik Santri")).toBeDefined()
  })

  it("should render summary metrics cards", () => {
    render(<PenilaianPage />)
    expect(screen.getByText("Total Santri")).toBeDefined()
    expect(screen.getByText("Rata-Rata Nilai")).toBeDefined()
    expect(screen.getByText("Nilai Tertinggi")).toBeDefined()
  })
})
