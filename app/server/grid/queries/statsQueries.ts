export const TEAM_STATISTICS_QUERY = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          percentage
        }
      }
      series {
        kills {
          avg
        }
      }
      segment(type: "round") {
        deaths {
          avg
        }
      }
    }
  }
`;

export const TEAM_STATISTICS_QUERY_NO_SEGMENT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          percentage
        }
      }
      series {
        kills {
          avg
        }
      }
    }
  }
`;

export const TEAM_STATISTICS_QUERY_IDS_ONLY = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
    }
  }
`;

export const PLAYER_STATISTICS_QUERY = `
  query PlayerStatistics($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      game {
        wins {
          percentage
        }
      }
      series {
        kills {
          avg
        }
        deaths {
          avg
        }
      }
    }
  }
`;

export function buildGameStatisticsQuery(selection: string) {
  return `
    query GameStatistics($titleId: ID!, $filter: GameStatisticsFilter) {
      gameStatistics(titleId: $titleId, filter: $filter) {
        ${selection}
      }
    }
  `;
}

export function buildSeriesStatisticsQuery(selection: string) {
  return `
    query SeriesStatistics($titleId: ID!, $filter: SeriesStatisticsFilter) {
      seriesStatistics(titleId: $titleId, filter: $filter) {
        ${selection}
      }
    }
  `;
}
