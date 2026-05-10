import { I } from '../icons'

const FILTERS = ['All', 'New', 'Today', 'This week', 'Unwatched', 'In progress']

export function FilterBar({ filter, setFilter, sort, setSort, searchQ, setSearchQ }) {
  return (
    <div className="filter-bar">
      <div className="filter-pills">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-pill${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="filter-right">
        <div className="filter-search-wrap">
          <I.Search />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search feed…"
            className="filter-search"
          />
          {searchQ && (
            <button className="filter-search-clear" onClick={() => setSearchQ('')}>
              <I.X />
            </button>
          )}
        </div>
        <select
          className="filter-sort"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="date">Newest first</option>
          <option value="views">Most viewed</option>
          <option value="channel">By channel</option>
        </select>
      </div>
    </div>
  )
}
