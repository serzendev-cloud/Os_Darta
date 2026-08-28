import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import RaportPage from "../dashboard/raport/page"

describe("RaportPage Responsive Academic Report Component Tests", () => {
  it("should render RaportPage title and description correctly", () => {
    render(<RaportPage />)
    expect(screen.getByText("Laporan Hasil Belajar (Raport Santri)")).toBeDefined()
  })

  it("should render metric summary cards", () => {
    render(<RaportPage />)
    expect(screen.getByText("Total Rapor Terkunci")).toBeDefined()
    expect(screen.getByText("Rata-Rata Angkatan")).toBeDefined()
    expect(screen.getByText("Predikat Mumtaz")).toBeDefined()
  })
})
