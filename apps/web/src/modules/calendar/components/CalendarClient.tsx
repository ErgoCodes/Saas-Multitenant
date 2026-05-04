'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    taskId: string;
    boardId: string;
    priority: string;
  };
}

interface CalendarClientProps {
  events: CalendarEvent[];
  onEventClick: (taskId: string) => void;
  onEventDrop: (taskId: string, newDate: string) => void;
  onExternalDrop: (taskId: string, newDate: string) => void;
}

export default function CalendarClient({ events, onEventClick, onEventDrop, onExternalDrop }: CalendarClientProps) {
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
