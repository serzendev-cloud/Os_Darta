import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  MobileCardStack,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
  ResponsiveDataGrid,
  MobileRowActions,
  ResponsivePagination,
} from "../index"

describe("WP-UI-020A Responsive Data Primitives Unit Tests", () => {
  it("should render MobileCardStack and MobileCard correctly", () => {
    render(
      <MobileCardStack>
        <MobileCard>
          <MobileCardHeader>
            <MobileCardTitle>Ahmad Santri</MobileCardTitle>
          </MobileCardHeader>
          <MobileCardContent>
            <p>Kelas 10A</p>
          </MobileCardContent>
          <MobileCardFooter>
            <span>Aktif</span>
          </MobileCardFooter>
        </MobileCard>
      </MobileCardStack>
    )

    expect(screen.getByText("Ahmad Santri")).toBeDefined()
    expect(screen.getByText("Kelas 10A")).toBeDefined()
    expect(screen.getByText("Aktif")).toBeDefined()
  })

  it("should render ResponsiveDataGrid with desktop and mobile representations", () => {
    const dummyData = [{ id: 1, name: "Data 1" }]

    render(
      <ResponsiveDataGrid
        data={dummyData}
        keyExtractor={(item) => item.id}
        renderDesktop={() => <div data-testid="desktop-view">Desktop View</div>}
        renderMobile={(item) => <div data-testid="mobile-view">{item.name}</div>}
      />
    )

    expect(screen.getByTestId("desktop-view")).toBeDefined()
    expect(screen.getByTestId("mobile-view")).toBeDefined()
  })

  it("should render MobileRowActions with primary action", () => {
    const handlePrimary = vi.fn()

    render(
      <MobileRowActions
        primaryAction={{
          key: "detail",
          label: "Lihat Detail",
          onClick: handlePrimary,
        }}
      />
    )

    const button = screen.getByText("Lihat Detail")
    expect(button).toBeDefined()
  })

  it("should render ResponsivePagination with correct page info", () => {
    const handlePageChange = vi.fn()

    render(
      <ResponsivePagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        onPageChange={handlePageChange}
      />
    )

    expect(screen.getByText("1 / 5")).toBeDefined()
  })
})
