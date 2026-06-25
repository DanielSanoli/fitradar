import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentCommunityRanking } from "@/components/student/StudentCommunityRanking";

describe("StudentCommunityRanking", () => {
  it("shows student rank and highlights current user", () => {
    render(
      <StudentCommunityRanking
        gamification={{
          studentId: "me",
          currentStreak: 5,
          longestStreak: 7,
          totalCheckInsDone: 12,
          badges: [],
          rank: 2,
        }}
        leaderboard={[
          {
            rank: 1,
            studentId: "other",
            studentName: "João",
            currentStreak: 10,
            totalCheckInsDone: 20,
          },
          {
            rank: 2,
            studentId: "me",
            studentName: "Ana",
            currentStreak: 5,
            totalCheckInsDone: 12,
          },
        ]}
        state="content"
        currentStudentId="me"
      />,
    );

    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText(/\(você\)/i)).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
  });
});
