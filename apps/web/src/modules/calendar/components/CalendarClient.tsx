'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getBoardColorStyle } from '@/lib/calendar-colors';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    taskId: string;
    boardId: string;
    priority: string;
    status?: string;
  };
}

interface CalendarClientProps {
  events: CalendarEvent[];
  onEventClick: (taskId: string) => void;
  onEventDrop: (taskId: string, newDate: string) => void;
  onExternalDrop: (taskId: string, newDate: string) => void;
  onDatesChange?: (startIso: string, endIso: string) => void;
}

export default function CalendarClient({
  events,
  onEventClick,
  onEventDrop,
  onExternalDrop,
  onDatesChange,
}: CalendarClientProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek',
      }}
      initialView="dayGridMonth"
      events={events}
      editable={true}
      droppable={true}
      datesSet={(info) => {
        onDatesChange?.(info.start.toISOString(), info.end.toISOString());
      }}
      eventContent={(eventInfo) => {
        const boardId = (eventInfo.event.extendedProps.boardId as string) || 'default';
        const status = eventInfo.event.extendedProps.status as string | undefined;
        const colorStyle = getBoardColorStyle(boardId);
        return (
          <div
            className={`w-full truncate rounded border px-1.5 py-0.5 text-xs font-medium leading-tight ${colorStyle} ${
              status === 'DONE' ? 'line-through opacity-60' : ''
            }`}
          >
            {eventInfo.event.title}
          </div>
        );
      }}
      eventClick={(info) => {
        onEventClick(info.event.extendedProps.taskId as string);
      }}
      eventDrop={(info) => {
        if (info.oldEvent.startStr === info.event.startStr) return;
        onEventDrop(info.event.extendedProps.taskId as string, info.event.startStr);
      }}
      eventReceive={(info) => {
        const taskId = info.event.extendedProps.taskId as string;
        const newDate = info.event.startStr;
        onExternalDrop(taskId, newDate);
        info.event.remove();
      }}
      height="auto"
    />
  );
}
