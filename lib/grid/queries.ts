export const TITLES_QUERY = `
  query Titles {
    titles {
      id
      name
      nameShortened
    }
  }
`;

export const TEAMS_QUERY = `
  query Teams($first: Int!, $after: Cursor) {
    teams(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          nameShortened
        }
      }
    }
  }
`;

export const ALL_SERIES_QUERY = `
  query AllSeries(
    $first: Int!
    $after: Cursor
    $filter: SeriesFilter
    $orderBy: SeriesOrderBy!
    $orderDirection: OrderDirection!
  ) {
    allSeries(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          startTimeScheduled
          updatedAt
          type
          title {
            id
            name
            nameShortened
          }
          tournament {
            id
            name
          }
        }
      }
    }
  }
`;

export const SERIES_BY_ID_QUERY = `
  query SeriesById($id: ID!) {
    series(id: $id) {
      id
      startTimeScheduled
      updatedAt
      type
      title {
        id
        name
        nameShortened
      }
      tournament {
        id
        name
      }
      teams {
        baseInfo {
          id
          name
          nameShortened
        }
      }
      players {
        id
        nickname
      }
      productServiceLevels {
        productName
        serviceLevel
      }
    }
  }
`;

export const SERIES_BY_ID_QUERY_NICKNAME_CAMEL = `
  query SeriesById($id: ID!) {
    series(id: $id) {
      id
      startTimeScheduled
      updatedAt
      type
      title {
        id
        name
        nameShortened
      }
      tournament {
        id
        name
      }
      teams {
        baseInfo {
          id
          name
          nameShortened
        }
      }
      players {
        id
        nickName
      }
      productServiceLevels {
        productName
        serviceLevel
      }
    }
  }
`;

export const TEAM_STATISTICS_QUERY = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          value
          count
          percentage
        }
      }
      series {
        kills {
          avg
        }
      }
      segment {
        deaths {
          avg
        }
      }
    }
  }
`;

export const TEAM_STATISTICS_QUERY_NO_PERCENT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          value
          count
        }
      }
      series {
        kills {
          avg
        }
      }
      segment {
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
          value
          count
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

export const TEAM_STATISTICS_QUERY_NO_SEGMENT_NO_PERCENT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          value
          count
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

export const TEAM_STATISTICS_QUERY_OBJECT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          count
          percentage
        }
      }
      series {
        kills {
          avg
        }
      }
      segment {
        deaths {
          avg
        }
      }
    }
  }
`;

export const TEAM_STATISTICS_QUERY_OBJECT_NO_PERCENT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          count
        }
      }
      series {
        kills {
          avg
        }
      }
      segment {
        deaths {
          avg
        }
      }
    }
  }
`;

export const TEAM_STATISTICS_QUERY_OBJECT_NO_SEGMENT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          count
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

export const TEAM_STATISTICS_QUERY_OBJECT_NO_SEGMENT_NO_PERCENT = `
  query TeamStatistics($teamId: ID!, $filter: TeamStatisticsFilter!) {
    teamStatistics(teamId: $teamId, filter: $filter) {
      aggregationSeriesIds
      game {
        wins {
          count
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

export const PLAYER_STATISTICS_QUERY = `
  query PlayerStatistics($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      game {
        wins {
          value
          count
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

export const PLAYER_STATISTICS_QUERY_NO_PERCENT = `
  query PlayerStatistics($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      game {
        wins {
          value
          count
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

export const PLAYER_STATISTICS_QUERY_OBJECT = `
  query PlayerStatistics($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      game {
        wins {
          count
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

export const PLAYER_STATISTICS_QUERY_OBJECT_NO_PERCENT = `
  query PlayerStatistics($playerId: ID!, $filter: PlayerStatisticsFilter!) {
    playerStatistics(playerId: $playerId, filter: $filter) {
      game {
        wins {
          count
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

export function buildSeriesStatisticsQuery(selection: string) {
  return `
    query SeriesStatistics($titleId: ID!, $filter: SeriesStatisticsFilter) {
      seriesStatistics(titleId: $titleId, filter: $filter) {
        ${selection}
      }
    }
  `;
}

export function buildGameStatisticsQuery(selection: string) {
  return `
    query GameStatistics($titleId: ID!, $filter: GameStatisticsFilter) {
      gameStatistics(titleId: $titleId, filter: $filter) {
        ${selection}
      }
    }
  `;
}
