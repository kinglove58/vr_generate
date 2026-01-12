export const TITLES_QUERY = `
  query Titles {
    titles {
      id
      name
    }
  }
`;

export const TEAMS_QUERY = `
  query Teams($first: Int!, $after: Cursor, $filter: TeamFilter) {
    teams(first: $first, after: $after, filter: $filter) {
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

export const TEAMS_QUERY_NO_FILTER = `
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
    $filter: SeriesFilter!
    $orderBy: SeriesOrderBy!
    $orderDirection: OrderDirection!
    $after: Cursor
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
        cursor
        node {
          id
          startTimeScheduled
          updatedAt
          type
          title {
            id
            name
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
              logoUrl
            }
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
          logoUrl
        }
      }
      players {
        id
        name
        nickName
      }
    }
  }
`;

export const SERIES_BY_ID_QUERY_PLAYER_BASEINFO = `
  query SeriesById($id: ID!) {
    series(id: $id) {
      id
      startTimeScheduled
      updatedAt
      type
      title {
        id
        name
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
          logoUrl
        }
      }
      players {
        baseInfo {
          id
          name
          nickName
        }
      }
    }
  }
`;
