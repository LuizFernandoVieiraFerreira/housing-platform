package shared

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func FormatTimestamptz(ts pgtype.Timestamptz) string {
	if !ts.Valid {
		return ""
	}
	return ts.Time.UTC().Format(time.RFC3339)
}

func FormatNullableTimestamptz(ts pgtype.Timestamptz) *string {
	if !ts.Valid {
		return nil
	}
	formatted := ts.Time.UTC().Format(time.RFC3339)
	return &formatted
}

func FormatDate(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format("2006-01-02")
}

func FormatNullableDate(d pgtype.Date) *string {
	if !d.Valid {
		return nil
	}
	formatted := d.Time.Format("2006-01-02")
	return &formatted
}

func ParseDate(value string) (pgtype.Date, error) {
	var d pgtype.Date
	if err := d.Scan(value); err != nil {
		return pgtype.Date{}, err
	}
	return d, nil
}
