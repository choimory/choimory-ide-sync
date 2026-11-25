import { defineTranslations } from "@getpaseo/plugin/client";

export const messages = defineTranslations({
  resources: {
    en: {
      title: "Kanban",
      open: "Open Kanban",
      columns: {
        needs_input: "Needs input",
        attention: "Attention",
        running: "Running",
        failed: "Failed",
        done: "Done",
      },
      summary: "{{total}} workspaces · {{waiting}} waiting on you",
      allProjects: "All",
      empty: "None",
      agents_one: "{{count}} agent",
      agents_other: "{{count}} agents",
      elapsed: {
        justNow: "just now",
        minutes: "{{n}}m ago",
        hours: "{{n}}h ago",
        days: "{{n}}d ago",
      },
    },
    ko: {
      title: "칸반",
      open: "칸반 열기",
      columns: {
        needs_input: "입력 대기",
        attention: "확인 필요",
        running: "실행 중",
        failed: "실패",
        done: "완료",
      },
      summary: "워크스페이스 {{total}}개 · 내 응답 대기 {{waiting}}개",
      allProjects: "전체",
      empty: "없음",
      agents_other: "에이전트 {{count}}",
      elapsed: {
        justNow: "방금",
        minutes: "{{n}}분 전",
        hours: "{{n}}시간 전",
        days: "{{n}}일 전",
      },
    },
  },
});
