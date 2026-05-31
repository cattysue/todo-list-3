export const SECTIONS = [
  { key: 'overdue', label: '기한 초과' },
  { key: 'today', label: '오늘 마감' },
  { key: 'tomorrow', label: '내일 마감' },
  { key: 'this_week', label: '이번 주 마감' },
] as const;

export type SectionKey = (typeof SECTIONS)[number]['key'];
