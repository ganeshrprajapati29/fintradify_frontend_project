import React from 'react';
import { Form, Pagination } from 'react-bootstrap';

const PaginationControls = ({ page, limit, total, onPageChange, onLimitChange, label = 'records' }) => {
  const totalPages = Math.max(Math.ceil((total || 0) / limit), 1);
  const start = total === 0 ? 0 : ((page - 1) * limit) + 1;
  const end = Math.min(page * limit, total);
  const firstPage = Math.max(1, page - 2);
  const lastPage = Math.min(totalPages, firstPage + 4);
  const pages = [];

  for (let item = firstPage; item <= lastPage; item += 1) {
    pages.push(
      <Pagination.Item key={item} active={item === page} onClick={() => onPageChange(item)}>
        {item}
      </Pagination.Item>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-3">
      <div className="text-muted small">
        Showing {start}-{end} of {total} {label}
      </div>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <Form.Select
          size="sm"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          style={{ width: 92 }}
          aria-label="Rows per page"
        >
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </Form.Select>
        <Pagination className="mb-0">
          <Pagination.First disabled={page === 1} onClick={() => onPageChange(1)} />
          <Pagination.Prev disabled={page === 1} onClick={() => onPageChange(page - 1)} />
          {firstPage > 1 && <Pagination.Ellipsis disabled />}
          {pages}
          {lastPage < totalPages && <Pagination.Ellipsis disabled />}
          <Pagination.Next disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
          <Pagination.Last disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} />
        </Pagination>
      </div>
    </div>
  );
};

export default PaginationControls;
