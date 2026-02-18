# Attendance Time Settings Feature

## Overview
This feature allows admins to configure check-in time rules and automatically mark employees as absent based on their attendance patterns.

## Implementation Summary

### Database Schema
- **New Model**: `AttendanceSettings`
  - `checkInLatestBy`: Latest time for normal check-in (format: HH:mm)
  - `permitDurationMinutes`: Grace period after latest check-in time
  - `autoMarkAbsentEnabled`: Enable/disable auto-mark absent
  - `checkOutLatestBy`: Optional latest check-out time

### Features Implemented

#### 1. Admin Settings Page (`/admin/attendance-settings`)
- Configure check-in latest by time (24-hour format)
- Set permit duration in minutes
- Enable/disable auto-mark absent
- Optional check-out time settings
- Real-time preview of permit end time
- Visual indicators showing how the rules work

#### 2. Attendance Time Rules
- **PRESENT**: Check-in before `checkInLatestBy`
- **LATE**: Check-in between `checkInLatestBy` and permit end time
- **ABSENT**: No check-in or check-in after permit end time

#### 3. Auto-Mark Absent
- Automatically marks employees as ABSENT if they haven't checked in by the permit end time
- Can be triggered manually via API endpoint
- Respects the `autoMarkAbsentEnabled` setting

#### 4. API Endpoints
- `GET /api/admin/attendance-settings` - Get current settings
- `POST /api/admin/attendance-settings` - Update settings
- `POST /api/admin/auto-mark-absent` - Manually trigger auto-mark absent

### How It Works

1. **Check-In Process**:
   - Employee attempts to check in
   - System checks current time against `checkInLatestBy` + `permitDurationMinutes`
   - Determines status: PRESENT, LATE, or ABSENT
   - If after permit period, rejects check-in and marks as ABSENT

2. **Auto-Mark Absent**:
   - Can be triggered manually by admin
   - Checks all active employees
   - Marks those without check-in as ABSENT based on time rules

### Setup Instructions

1. **Update Database Schema**:
   ```bash
   npx prisma db push
   # OR
   npx prisma migrate dev --name add_attendance_settings
   ```

2. **Access Settings**:
   - Login as admin
   - Go to Admin Dashboard
   - Click "Attendance Time Settings"
   - Configure your preferred times

3. **Default Settings**:
   - Check-in latest by: 09:00
   - Permit duration: 30 minutes
   - Auto-mark absent: Enabled

## Additional Professional Features (Future Enhancements)

### Recommended Additions:

1. **Different Times for Different Days**
   - Weekday vs Weekend schedules
   - Holiday exceptions
   - Flexible Friday hours

2. **Department/Role-Based Settings**
   - Different check-in times for different departments
   - Manager vs Employee rules
   - Shift-based configurations

3. **Notifications & Reminders**
   - Email/SMS reminders before check-in deadline
   - Late arrival notifications
   - Absent notifications to managers

4. **Advanced Reporting**
   - Late arrival trends
   - Department-wise attendance stats
   - Time-based attendance analytics

5. **Exception Handling**
   - Leave management integration
   - Holiday calendar
   - Emergency exceptions
   - Manager override capability

6. **Check-Out Time Rules**
   - Minimum work hours requirement
   - Early leave detection
   - Overtime calculation

7. **Cron Job Integration**
   - Automated daily auto-mark absent
   - Scheduled reports
   - Reminder notifications

8. **Mobile App Features**
   - Push notifications
   - Quick check-in widget
   - Attendance calendar view

9. **Integration Features**
   - Calendar sync (Google Calendar, Outlook)
   - Payroll system integration
   - HR system integration

10. **Analytics Dashboard**
    - Real-time attendance monitoring
    - Predictive analytics
    - Attendance heatmaps

## Usage Examples

### Example 1: Strict 9 AM Policy
- Check-in latest by: `09:00`
- Permit duration: `0` minutes
- Result: Employees must check in exactly by 9 AM or be marked ABSENT

### Example 2: Flexible with Grace Period
- Check-in latest by: `09:00`
- Permit duration: `30` minutes
- Result: 
  - Check-in before 9:00 AM → PRESENT
  - Check-in between 9:00-9:30 AM → LATE
  - Check-in after 9:30 AM → Cannot mark, marked as ABSENT

### Example 3: No Auto-Mark
- Check-in latest by: `09:00`
- Permit duration: `60` minutes
- Auto-mark absent: `Disabled`
- Result: Employees can check in anytime, but status will be LATE if after 9 AM

## API Usage

### Get Settings
```bash
GET /api/admin/attendance-settings
```

### Update Settings
```bash
POST /api/admin/attendance-settings
Content-Type: application/json

{
  "checkInLatestBy": "09:00",
  "permitDurationMinutes": 30,
  "autoMarkAbsentEnabled": true,
  "checkOutLatestBy": "18:00"
}
```

### Trigger Auto-Mark Absent
```bash
POST /api/admin/auto-mark-absent
```

## Notes

- Time format is 24-hour (HH:mm)
- Permit duration is in minutes (0-1440)
- Settings are applied immediately after saving
- Only one active setting configuration at a time
- Previous settings are deactivated when new ones are created
