import React, { useMemo, useState } from 'react';

/**
 * In-app user manual for AeroAttendance.
 * role: 'admin' | 'employee' — decides which guide opens first.
 * onNavigate(tab): optional, lets a chapter open the related admin page.
 */

const ADMIN_CHAPTERS = [
  {
    id: 'setup',
    group: 'Start here',
    title: 'First-day setup checklist',
    where: 'Do these once, in this order',
    summary: 'Set these up before employees start punching in. After that, attendance, approvals, tracking and reports work on their own.',
    steps: [
      'Settings → General: check the company name, logo, email and phone. They are printed on salary slips, letters and certificates.',
      'Attendance Locations: put the office pin on the map and choose the punch radius (200–300 m is typical for one office). Employees can punch in only inside this area.',
      'Shifts: check the General shift timing and create Morning, Evening or Night shifts if you need them. Then assign a shift to every employee.',
      'Edit Employee → Employee ID series: confirm the prefix and next number (for example AWE001). New employees get the next ID automatically.',
      'Add Employee: create each employee with their joining date, salary, department and bank details.',
      'Ask employees to install the AeroAttendance app, sign in with their email, and allow location ("Allow all the time" on Android) and notifications.',
    ],
    tips: [
      'Assign the Night Shift to people who work at night. Otherwise they are marked late and their punch-outs are flagged as missed at the wrong time.',
      'Set the punch radius small enough to stop punching from home, but not so small that GPS drift blocks people inside the building.',
    ],
  },
  {
    id: 'signin',
    group: 'Start here',
    title: 'Signing in and account security',
    where: 'Login page · System → Login Credentials',
    tab: 'login-credentials',
    summary: 'Managers sign in with email and password. Employees sign in with their password or a one-time code (OTP) sent to their email.',
    steps: [
      'Open the website and choose Manager Login, then enter your email and password.',
      'To change your password: System → Login Credentials → enter the current password and the new password twice → Save.',
      'Employees who forget their password use "Reset Password" on the login page or in the app. A code is emailed to them.',
    ],
    tips: [
      'Use a strong password and never share it on chat. Change it if it has been shared.',
      'Always sign out on shared computers.',
    ],
  },
  {
    id: 'dashboard',
    group: 'Daily work',
    title: 'Dashboard',
    where: 'Overview → Dashboard',
    tab: 'overview',
    summary: 'Today at a glance: who is on duty, who is late, what is waiting for your approval, and a live radar of the team.',
    steps: [
      'The top cards show On duty, At office, On field, Late today, Not punched in and Awaiting approval. Click any card to open the related page.',
      'Live radar: every dot is an on-duty employee placed by distance and direction from the office. Click it to open Live Tracking.',
      'Waiting for approval: approve or reject the latest attendance straight from the dashboard.',
      'Latest punch-ins: who came in most recently, on time or late.',
      'Further down you will find the charts for attendance, leave, tasks and payroll.',
    ],
  },
  {
    id: 'employees',
    group: 'People',
    title: 'Adding and editing employees',
    where: 'People → Add Employee / Edit Employee / Employee List',
    tab: 'add-employee',
    summary: 'Every employee needs a profile before they can sign in. The Employee ID comes from the ID series automatically, and you can edit it any time.',
    steps: [
      'People → Add Employee: fill in name, email, phone, designation, department, joining date, salary and bank details, then Save. The employee receives a welcome email.',
      'The Employee ID field is filled with the next ID of the series (for example AWE014). You can type a different ID if needed. It must be unique.',
      'People → Edit Employee: pick an employee to update details, salary, ID, team or status.',
      'Employee ID series (on the Edit Employee page): change the prefix or the next number and click "Save series". "Apply series to existing employees" renumbers everyone in joining-date order. Use it only once, right after setup.',
      'People → Block Employees stops an employee from signing in (for example after exit). Unblock Employees restores access.',
    ],
    tips: [
      'The joining date matters: attendance reports show "-" for days before joining, and monthly performance starts from that month.',
      'Salary entered here is used in the attendance report payroll section unless a salary slip exists for that month.',
    ],
  },
  {
    id: 'teams',
    group: 'People',
    title: 'Teams',
    where: 'People → Teams',
    tab: 'teams',
    summary: "Employees grouped by team, with today's attendance, working hours and tasks for each team.",
    steps: [
      'Set the team on each employee profile (Edit Employee).',
      "Open People → Teams to see each team's members, who is present and their hours.",
    ],
  },
  {
    id: 'tracking',
    group: 'People',
    title: 'Live Tracking and radar',
    where: 'People → Live Tracking',
    tab: 'tracking',
    summary: 'See where every on-duty employee is, what they are doing, and the route they took during the day.',
    steps: [
      'The top cards show On duty, At office, On field, Moving, Live GPS and Off duty. Click a card to filter the map.',
      'Map: each photo marker is an employee. A solid ring means live GPS. A dashed ring means the last known location (for example the punch-in point). Switch between Streets, Dark and Satellite with the selector.',
      'Routes: coloured lines show where on-duty employees travelled in the last 12 hours.',
      'Radar (right side): the office is at the centre. Each dot is placed by direction and distance and lights up when the sweep passes. Choose a range of 1, 5, 25, 100, 500 or 1000 km, or type any custom range up to 20,000 km. The LOG scale keeps nearby and far-away people readable together.',
      'Click an employee (on the map, the radar or the list) to open their details: what they are doing now, punch-in time, hours, battery and distance from office.',
      "Route timeline: the employee's day as a story. You see punch in, each stop with how long they stayed, each journey with distance and average speed, and punch out. Click a row to zoom the map to it. Pick another date to see an older day.",
      '"Follow live" keeps the map centred on the selected employee as new locations arrive.',
      'People → Employee Locations shows only the people who share location from the app (Live now, Last 24 h, All). Click a person to see their live position on a large map, the exact route of the day point by point with time, address and speed, and pick any date to see an older route.',
      'Play route: replays the selected day like a video. The blue marker walks along the route with the time shown, and you can drag the slider or choose 1x, 3x or 10x speed.',
      'Route check tells you if a field route looks genuine. Jumps that are impossible by road (more than 150 km/h) are flagged as a possible fake location or wrong GPS fix and drawn as an orange dashed line. Long gaps with no location (phone off or app closed) are listed too. Click a line to zoom the map there.',
      'Stops without an address have a "Find address" link that looks up the place name.',
      '"Light theme / Dark theme" switches the radar and map style. The choice is remembered and the dashboard radar follows it.',
      '"Client view" opens the page full screen with a bigger map, a clock and a plain-language legend, which is ideal to show a client. "Auto tour" then focuses each on-duty employee for 10 seconds in turn. Press Esc or "Exit client view" to leave.',
    ],
    tips: [
      'Live movement needs the latest app, location set to "Allow all the time", and battery saver turned off for the app. Without it you still see the punch-in and punch-out locations.',
      'Statuses: At office = within the office area. On field = punched in elsewhere. Moving = travelling now. Outside area = away from their assigned punch area. Off duty = not punched in.',
    ],
  },
  {
    id: 'attendance',
    group: 'Attendance',
    title: 'Attendance records and the attendance report',
    where: 'Attendance & Leave → Attendance',
    tab: 'attendance',
    summary: 'All punch records with filters. From here you can download the complete monthly attendance report for HR and payroll.',
    steps: [
      'Filter by date range and status (pending, approved, rejected) to find records. Use "This month", "Last month" or "Today" for a quick period.',
      'To see one person only, choose them in the Employee filter. The page then shows just their attendance, and the download button gives the report for that employee alone.',
      'To download the report: choose Start date and End date (up to 92 days, usually the 1st to the last day of the month), then click Download CSV. It opens directly in Excel or Google Sheets.',
      'The same report is available from Overview → Reports Center.',
    ],
    tips: ['See the chapter "Reading the attendance report" for what each column and code means.'],
  },
  {
    id: 'approvals',
    group: 'Attendance',
    title: 'Attendance Approvals',
    where: 'Attendance & Leave → Attendance Approvals',
    tab: 'attendance-approvals',
    summary: 'Review each punch with its time, location and hours, then approve or reject it. Employees are notified of your decision.',
    steps: [
      'The cards on top show Pending, Pending today, Still working, Late, Auto-closed and Approved today. Click one to filter.',
      'Each row shows punch in and out time, late minutes, hours worked, shift, punch location (with a Google Maps link) and Office/WFH mode.',
      'Click Approve or Reject on a row. When rejecting you can type a reason; the employee sees it.',
      'To act on many at once, tick the checkboxes (or the top checkbox for the whole page) and click Approve selected or Reject selected. "Approve all on this page" does the same for everything shown.',
      'Use the Approved and Rejected tabs to look back or change a decision.',
    ],
    tips: [
      'A pending record is approved automatically 5 minutes after the employee punches out, unless you act on it first.',
      'Records the system closed in the past (older versions closed forgotten punch-outs automatically) are never auto-approved. Check them and correct the punch-out time in Manual Attendance.',
    ],
  },
  {
    id: 'manual',
    group: 'Attendance',
    title: 'Manual attendance, holidays and half days',
    where: 'Attendance & Leave → Manual Attendance',
    tab: 'manual-attendance',
    summary: 'Add or correct punches (including night shifts and extra sessions), mark many employees at once, and fix forgotten punch-outs.',
    steps: [
      'Add / correct: choose the employee, the working day and the shift (or leave it on Auto), then the punch-in and punch-out time. "Use shift timing" fills the times from the shift. The employee\'s existing sessions for that day are listed so you do not create duplicates.',
      'Night shift: when the punch-out time is earlier than the punch-in time, "Punch out is on the next day" is ticked automatically.',
      'Saving the same employee, day and shift again corrects that record. Tick "Add as a new session" to add another shift on the same day (for example an evening shift after a morning shift). Overlapping times are refused.',
      'Add a reason or note, choose Office or WFH and Approved or Pending. Late, early-out and overtime are worked out from the shift automatically.',
      'Mark many employees: pick a day and Holiday, Half day, Present at shift time or Remove holiday, for all active employees or the ones you tick. Present skips anyone who already punched.',
      'Missed punch-outs: employees who forgot to punch out (6 hours after the shift end), with the shift end suggested as punch-out. Adjust if needed and click "Save & approve".',
      'In Attendance records every session is a separate row with tags for session number, extra shift, late, auto-closed and who entered it (App, Admin or Bulk). Edit lets you change the punch date and time, shift, status, mode, holiday, half day and note.',
    ],
  },
  {
    id: 'active',
    group: 'Attendance',
    title: 'Active attendance',
    where: 'Attendance & Leave → Active Attendance',
    tab: 'active-attendance',
    summary: 'Everyone who is punched in right now, with their running hours.',
    steps: [
      'Pause stops the hour counter for an employee (for example during an unpaid break). Resume starts it again.',
      'Paused time is not counted in hours worked.',
    ],
  },
  {
    id: 'shifts',
    group: 'Attendance',
    title: 'Shifts, late marks and night shifts',
    where: 'Attendance & Leave → Shifts',
    tab: 'shifts',
    summary: 'Shifts decide when someone is late, when reminders go out, and which days are working days or weekly offs.',
    steps: [
      'Create a shift with start time, end time, grace minutes (late allowed), early-out grace, break and working days.',
      'A shift whose end time is earlier than its start time (for example 22:00 to 06:00) is an overnight shift. The whole night counts as the day it started.',
      'Mark one shift as Default. Employees without their own shift follow it.',
      'Click "Assign employees" on a shift card to give it to one or many employees at once. Turn on "Keep their other shifts too" to add this shift without removing the ones they already have.',
      'Multiple shifts for one employee: in the Employee shift roster click "Change shifts" and tick every shift they work. The shift nearest to the punch time is used, and each shift gets its own attendance, so one person can work two shifts in a day.',
      'When you change a shift time, choose how far back late marks should be updated: from today, from the 1st of this month, or not at all. The dashboard, approvals and reports then show late by the new time.',
      '"Update late marks" (top of the page) re-checks saved attendance against the current shift timings from any date you pick.',
      'Extra shifts: after an employee has worked their shift(s) for the day they can punch in again from the app or website ("Start extra shift"). That session is saved as an extra shift, is never marked late, and is paid as extra hours. Up to 6 sessions per day are allowed.',
    ],
    tips: [
      'Late = punch-in after start time + grace minutes. Punching in after the shift has already ended is treated as working outside shift hours, not as late.',
      'Attendance is never punched in or out automatically. If someone does not punch out, 6 hours after their shift end the session is listed under Manual Attendance → Missed punch-outs for you to enter the real time; their hours count only after that, and they can still punch in normally the next day.',
      'The working days of a shift decide the weekly off (WO) in the attendance report.',
    ],
  },
  {
    id: 'locations',
    group: 'Attendance',
    title: 'Attendance locations (punch area)',
    where: 'Attendance & Leave → Attendance Locations',
    tab: 'attendance-radius',
    summary: 'Where employees are allowed to punch in. There is one office area for everyone, and you can give any employee their own area (for example a client site).',
    steps: [
      'Office: click on the map or enter latitude and longitude, set the radius in metres, and save.',
      'Per employee: in the employee list below the map, click Edit on the employee, switch on "Also allow punching at this place", click the map to place the point, set the radius and save. That employee can then punch inside their own area and also inside the office area.',
      'Work locations (Step 2): click "Add location" for every branch, warehouse or client site, place it on the map and set the radius. Then click "Employees" to choose who works there. Those employees can punch inside it.',
      'Shift areas (Step 3, optional): click Set area on a shift and place its point on the map. Everyone in that shift can then punch there too.',
      'Employees (Step 4): "Sites" chooses the work locations of an employee, the "Field mode" switch lets drivers and field staff punch from anywhere (their live location is tracked while on duty), and "Own area" adds a personal place.',
      'Fake GPS (mock location) apps are detected by the app and such punches are refused, in every mode.',
      'Punching outside every allowed area is not blocked: the punch is recorded, marked "Outside area" with the distance, the employee gets a message and HR gets a notification. Use the "Outside area" filter in Attendance Approvals to review them.',
      'An employee can punch inside any of their areas: the office area, the area of each of their shifts, and their own area. Saving one area never changes the others.',
      'Approved Work From Home days skip the location check.',
    ],
    tips: ['The office point is also the centre of the Live Tracking radar.'],
  },
  {
    id: 'leave',
    group: 'Attendance',
    title: 'Leave requests and paid leaves',
    where: 'Attendance & Leave → Leave Requests / Paid Leaves',
    tab: 'leaves',
    summary: 'Employees apply for leave from the app or website. You approve or reject it, and approved leave appears in the attendance report.',
    steps: [
      'Open Leave Requests, review the dates and reason, and click Approve or Reject.',
      'Leave types: Paid (L, paid), Unpaid (LWP, not paid) and Half-day (HL).',
      'Paid Leaves shows each employee\'s eligibility and balance. Approve paid-leave requests there.',
    ],
  },
  {
    id: 'wfh',
    group: 'Attendance',
    title: 'Work from home',
    where: 'Attendance & Leave → Work From Home',
    tab: 'wfh',
    summary: 'On an approved WFH day the employee can punch in from anywhere. The day is shown as WFH in reports.',
    steps: ['Review the request dates and reason, add remarks if needed, and Approve or Reject.'],
  },
  {
    id: 'tasks',
    group: 'Work & payroll',
    title: 'Tasks',
    where: 'Work & Payroll → Tasks',
    tab: 'tasks',
    summary: 'Assign work to employees and follow its status.',
    steps: [
      'Create a task with title, description, employee, priority and due date.',
      'Employees update the status from their portal or app. You can see progress here and on the dashboard.',
      'A task-submission check runs every working day at 10:30 AM and reminds people who have not updated their tasks.',
    ],
  },
  {
    id: 'performance',
    group: 'Work & payroll',
    title: 'Monthly performance',
    where: 'Work & Payroll → Monthly Performance',
    tab: 'monthly-performance',
    summary: 'A monthly score for each employee from attendance quality, task completion, leave discipline and certificates.',
    steps: [
      'Choose the month to see ranked employees, badges and team rankings.',
      'Monthly performance emails go out on the 1st of each month at 9:10 AM. Daily performance emails go out Monday to Saturday at 8 PM.',
    ],
  },
  {
    id: 'salary',
    group: 'Work & payroll',
    title: 'Salary slips',
    where: 'Work & Payroll → Salary Slips',
    tab: 'salary',
    summary: 'Generate one-page salary slips with the company letterhead. The amount is worked out from attendance, including extra shifts.',
    steps: [
      'Choose the employee and the month. With "Salary based on: Attendance" the page shows the monthly salary, payable days, present, leave, LWP, absent, weekly offs, holidays, sessions and extra shifts.',
      'Loss of pay = per-day salary (monthly salary / days in month) x unpaid days (absent, LWP, half of each half day, days before joining).',
      'Extra shift pay = extra-shift hours x hourly rate (per-day salary / shift hours) x the extra shift pay rate set in Settings → Attendance. Extra-shift hours are the hours of a second or later session outside the day\'s first shift, plus all hours worked on a weekly off or holiday.',
      'Net salary = monthly salary - loss of pay + extra shift pay + any other allowance - any other deduction. The slip PDF shows each line and the attendance summary.',
      'Generate the slip after the month ends and after attendance approvals, because pending days are counted as present. "Fixed amount" is still available for special cases.',
    ],
  },
  {
    id: 'reimbursements',
    group: 'Work & payroll',
    title: 'Reimbursements',
    where: 'Work & Payroll → Reimbursements',
    tab: 'reimbursements',
    summary: 'Employees submit expense claims with receipts. You review and approve or reject them.',
    steps: ['Filter by status, open the receipt, and Approve or Reject with a note.'],
  },
  {
    id: 'letters',
    group: 'HR documents',
    title: 'Offer letters, relieving letters and certificates',
    where: 'HR Documents → Offer Letter / Relieving Letter / Certificates',
    tab: 'offer-letter',
    summary: 'Ready-to-send HR letters on the Aerowheels letterhead.',
    steps: [
      'Offer Letter: fill in candidate details, designation, CTC and joining date, then generate the PDF and email it.',
      'Relieving Letter: choose the employee, last working day and remarks, then generate it.',
      'Certificates: generate experience, internship or appreciation certificates. Each one has a QR code that anyone can scan to verify it on the website.',
    ],
  },
  {
    id: 'documents',
    group: 'HR documents',
    title: 'Documents and compliance',
    where: 'HR Documents → Documents / Compliance Center',
    tab: 'documents',
    summary: 'Collect employee documents (ID proof, certificates, bank proof) and see who still has to submit.',
    steps: [
      'Documents: download, approve or reject what employees upload.',
      'Compliance Center: lists employees with missing documents and the overall document status.',
    ],
  },
  {
    id: 'reports',
    group: 'Reports',
    title: 'Reports Center',
    where: 'Overview → Reports Center',
    tab: 'reports-center',
    summary: 'One place for summaries of employees, attendance, tasks, leave, payroll and reimbursements, with downloads.',
    steps: ['Pick a date range, review the summary, and download the attendance report or the overall summary.'],
  },
  {
    id: 'report-format',
    group: 'Reports',
    title: 'Reading the attendance report',
    where: 'Downloaded CSV file (opens in Excel or Google Sheets)',
    summary: 'The report follows the usual HR format. It has four parts: a header, a muster roll, a daily detail section and a payroll summary.',
    steps: [
      'Header: company, period, number of employees, when it was generated and by whom, and the legend of codes.',
      'Muster roll: one row per employee and one column per day with a code, followed by totals: Present, WFH, Half Day, Leave, LWP, Absent, Weekly Off, Holiday, Late Days, Total Hours, Average Hours/Day, Overtime, Pending Approval and Payable Days.',
      'Daily detail: every day of every employee with shift, status, punch in and out, hours (h:mm), late, early-out and overtime minutes, work mode, punch-in location, approval status and remarks (such as "Punch out missing", "Auto-closed", "Short day" or "Worked on weekly off").',
      'Muster roll and daily detail also show sessions and extra-shift hours for every employee and day.',
      'Payroll summary: monthly salary, payable days, unpaid days, salary for payable days, extra-shift hours and pay, loss of pay, total payable for the period, and bank details. The last row is the total.',
    ],
    codes: [
      ['P', 'Present', 'Punched in at the office (or allowed area)'],
      ['WFH', 'Work from home', 'Punched in on an approved WFH day'],
      ['HD', 'Half day', 'Marked half day, or worked on a half-day leave'],
      ['L', 'Paid leave', 'Approved paid leave'],
      ['HL', 'Half-day leave', 'Approved half-day leave without a punch'],
      ['LWP', 'Leave without pay', 'Approved unpaid leave'],
      ['A', 'Absent', 'Working day without punch or leave'],
      ['WO', 'Weekly off', "Not a working day in the employee's shift"],
      ['H', 'Holiday', 'Marked holiday'],
      ['-', 'Not applicable', 'Before joining, a future date, or today (not over yet)'],
    ],
    tips: [
      'Payable days = Present + WFH + Paid leave + Weekly off + Holiday + half of each Half day. Absent and LWP are unpaid.',
      'Rejected attendance is not counted. Pending attendance is counted until it is rejected, so finish approvals before running payroll.',
    ],
  },
  {
    id: 'notifications',
    group: 'System',
    title: 'Notifications and automatic emails',
    where: 'System → Notifications · Settings → Notifications',
    tab: 'notifications',
    summary: 'The system sends alerts and emails automatically, so HR does not have to chase people.',
    steps: [
      'Every 5 minutes: late punch-in alerts, punch-out reminders near shift end, and late punch-out alerts, all based on each employee\'s shift.',
      'On punch in and punch out: a confirmation email to the employee and a notice to HR.',
      'Your decisions on attendance, leave, WFH and reimbursements are sent to the employee as notifications.',
      'Turn individual emails on or off in Settings → Notifications.',
    ],
  },
  {
    id: 'settings',
    group: 'System',
    title: 'Settings',
    where: 'System → Settings',
    tab: 'settings',
    summary: 'Company details and the rules the whole system follows.',
    steps: [
      'General: company name, logo, contact details.',
      'Attendance: office timings, grace periods, working days, and the extra shift pay rate (not paid, 1x, 1.25x, 1.5x or 2x).',
      'Leave: leave balances and approval rules.',
      'Notifications: which emails and alerts are sent.',
      'Admin: manager account preferences.',
    ],
  },
  {
    id: 'faq',
    group: 'Help',
    title: 'Common questions',
    where: 'Troubleshooting',
    summary: 'Quick answers to the questions HR asks most often.',
    faq: [
      ['A punch shows "Outside area".', 'The employee punched outside every area allowed for them. The punch is recorded and you are notified. Check the place on Live Tracking, then approve or reject it in Attendance Approvals. If they work there regularly, add that place as a work location or their own area.'],
      ['Someone forgot to punch out.', 'Nothing is punched out automatically. 6 hours after the shift end the session appears in Manual Attendance → Missed punch-outs. Enter the real punch-out time and click Save & approve.'],
      ['A night-shift worker shows as late or absent.', 'Assign them the Night Shift in Shifts. Their attendance then belongs to the day the shift started.'],
      ['Live Tracking shows only the punch-in point.', "The employee's phone is not sending live location. Ask them to update the app, set location to \"Allow all the time\", and turn off battery saver for AeroAttendance."],
      ['The attendance report shows A on a holiday.', 'In Manual Attendance, create or edit the record for that day and tick Holiday, then download the report again.'],
      ['How do I give someone a different Employee ID?', 'Edit Employee → change the Employee ID → Save. It must not be used by anyone else.'],
    ],
  },
];

const EMPLOYEE_CHAPTERS = [
  {
    id: 'e-start',
    group: 'Start here',
    title: 'Getting started with the app',
    where: 'AeroAttendance mobile app',
    summary: 'Use the app every working day to punch in and out, apply for leave, and see your salary slips and tasks.',
    steps: [
      'Install AeroAttendance from the link HR shares with you and open it.',
      'Sign in with your official email, using your password or the OTP sent to your email.',
      'When asked, allow Location ("Allow all the time" on Android) and Notifications.',
      'Turn off battery saver for AeroAttendance so attendance and reminders work properly.',
    ],
  },
  {
    id: 'e-punch',
    group: 'Daily work',
    title: 'Punch in and punch out',
    where: 'App home screen · Website → Attendance',
    summary: 'Punch in when you start and punch out when you finish. Your location is checked against your allowed punch area.',
    steps: [
      'Open the app at your work location and tap Punch In. Wait for the location check to finish.',
      'At the end of your shift, tap Punch Out.',
      'Your shift and timing are shown on the home screen. Punching in after the start time plus grace minutes is marked late.',
      'On an approved Work From Home day you can punch in from anywhere.',
      'After your shift you can work another session: tap "Start extra shift". It is recorded separately, is not marked late, and the extra hours are paid as per company policy.',
      'Working as: if you have more than one shift, pick the shift you are working on the home screen before punching in. Field staff allowed by HR also see "Field", which lets you punch from anywhere while your live location is shared.',
      'The app changes its look with your shift: a night look for night shifts, sunrise colours in the morning, sunset colours in the evening and green for field work.',
      'The "Today\'s sessions" card on the home screen lists every punch in and out of the day with its hours.',
    ],
    tips: [
      'If punch-in fails with "outside the allowed area", move closer to the office or contact HR.',
      'If you forget to punch out, your hours are not counted until HR enters the real punch-out time, so always punch out.',
      'While you are on duty the app shares your location with HR. A notification shows that sharing is on, and it stops when you punch out.',
    ],
  },
  {
    id: 'e-attendance',
    group: 'Daily work',
    title: 'My attendance, calendar and report',
    where: 'Attendance → Calendar / Attendance',
    summary: 'See every day of your attendance and its approval status.',
    steps: [
      'Calendar shows each day as present, absent, leave or holiday.',
      'Attendance lists your punches with hours and status (Pending, Approved, Rejected).',
      'To download your attendance report, choose the start and end dates and click Download CSV.',
    ],
    tips: ['Pending attendance is usually approved automatically 5 minutes after you punch out.'],
  },
  {
    id: 'e-leave',
    group: 'Requests',
    title: 'Leave and work from home',
    where: 'Attendance → Leave Requests / Work From Home',
    summary: 'Apply for leave or WFH and follow its status.',
    steps: [
      'Leave Requests → choose the dates, the type (Paid, Unpaid or Half-day) and a reason → Submit.',
      'Work From Home → choose the dates and a reason → Submit.',
      'You get a notification when HR approves or rejects your request.',
    ],
  },
  {
    id: 'e-work',
    group: 'Requests',
    title: 'Tasks and reimbursements',
    where: 'Work → My Tasks / Reimbursements',
    summary: 'Keep your task status up to date and claim work expenses.',
    steps: [
      'My Tasks: open a task and update its status as you progress. Update before 10:30 AM to avoid a reminder.',
      'Reimbursements: add the amount, category and a photo of the receipt → Submit.',
    ],
  },
  {
    id: 'e-docs',
    group: 'Documents',
    title: 'Salary slips, certificates and documents',
    where: 'Documents → Salary Slips / Certificates / Documents',
    summary: 'Download your official documents any time.',
    steps: [
      'Salary Slips: choose the month and download the PDF.',
      'Certificates: download certificates issued to you. Each has a QR code for verification.',
      'Documents: upload the documents HR asks for (ID proof, bank proof and so on) and see whether they were approved.',
    ],
  },
  {
    id: 'e-account',
    group: 'Account',
    title: 'Profile, password and notifications',
    where: 'Account → Edit Profile / Change Password / Notifications',
    summary: 'Keep your details correct and your account safe.',
    steps: [
      'Edit Profile: update your phone number, address and photo. Ask HR to change other details.',
      'Change Password: enter your current password and the new one twice.',
      'Notifications: all approvals, reminders and HR messages in one list.',
    ],
  },
];

const highlight = (text, query) => {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

const chapterText = (chapter) => [
  chapter.title, chapter.where, chapter.summary,
  ...(chapter.steps || []), ...(chapter.tips || []),
  ...(chapter.faq || []).flat(), ...(chapter.codes || []).flat(),
].join(' ').toLowerCase();

const UserManual = ({ role = 'admin', onNavigate }) => {
  const [guide, setGuide] = useState(role === 'admin' ? 'admin' : 'employee');
  const [query, setQuery] = useState('');
  const chapters = guide === 'admin' ? ADMIN_CHAPTERS : EMPLOYEE_CHAPTERS;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? chapters.filter((chapter) => chapterText(chapter).includes(q)) : chapters;
  }, [chapters, query]);

  const groups = useMemo(() => visible.reduce((acc, chapter) => {
    (acc[chapter.group] = acc[chapter.group] || []).push(chapter);
    return acc;
  }, {}), [visible]);

  const jump = (id) => {
    const el = document.getElementById(`um-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const q = query.trim();
  let number = 0;

  return (
    <div className="um-page">
      <style>{`
        .um-page { display: grid; gap: 16px; color: #0f172a; }
        .um-hero { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 14px; padding: 22px 24px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #06135c 0%, #0a1f8f 55%, #2563eb 100%); box-shadow: 0 16px 36px rgba(10,31,143,.2); }
        .um-hero h2 { margin: 4px 0 6px; font-weight: 800; font-size: 1.6rem; }
        .um-hero p { margin: 0; max-width: 640px; color: rgba(255,255,255,.82); font-size: .92rem; }
        .um-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #bfdbfe; }
        .um-switch { display: inline-flex; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.25); border-radius: 12px; padding: 3px; }
        .um-switch button { border: none; background: transparent; color: #fff; padding: 7px 14px; border-radius: 9px; font-weight: 700; font-size: .84rem; }
        .um-switch button.active { background: #fff; color: #0a1f8f; }
        .um-layout { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 16px; align-items: start; }
        .um-toc { position: sticky; top: 12px; background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; padding: 14px; box-shadow: 0 6px 18px rgba(15,23,42,.05); max-height: calc(100vh - 40px); overflow-y: auto; }
        .um-search { width: 100%; border: 1px solid #dbe3ef; border-radius: 10px; padding: 9px 12px; font-size: .88rem; margin-bottom: 12px; }
        .um-search:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .um-toc h6 { font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #94a3b8; margin: 12px 0 4px; }
        .um-toc button { display: block; width: 100%; text-align: left; border: none; background: none; padding: 6px 8px; border-radius: 8px; font-size: .84rem; color: #334155; font-weight: 600; }
        .um-toc button:hover { background: #eef2ff; color: #0a1f8f; }
        .um-chapter { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; padding: 20px 22px; box-shadow: 0 6px 18px rgba(15,23,42,.05); scroll-margin-top: 12px; }
        .um-chapter + .um-chapter { margin-top: 14px; }
        .um-chapter-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: flex-start; }
        .um-num { display: inline-flex; width: 30px; height: 30px; border-radius: 9px; background: #eef2ff; color: #0a1f8f; font-weight: 800; align-items: center; justify-content: center; margin-right: 10px; font-size: .86rem; flex: 0 0 auto; }
        .um-chapter h3 { display: flex; align-items: center; margin: 0; font-size: 1.12rem; font-weight: 800; }
        .um-where { display: inline-block; margin-top: 8px; font-size: .76rem; font-weight: 700; color: #0a1f8f; background: #eef2ff; border-radius: 999px; padding: 3px 10px; }
        .um-summary { margin: 12px 0 0; color: #475569; font-size: .93rem; line-height: 1.6; }
        .um-open { border: 1px solid #0a1f8f; color: #0a1f8f; background: #fff; border-radius: 10px; padding: 6px 12px; font-size: .8rem; font-weight: 800; white-space: nowrap; }
        .um-open:hover { background: #0a1f8f; color: #fff; }
        .um-steps { counter-reset: step; list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 8px; }
        .um-steps li { position: relative; padding: 10px 12px 10px 46px; background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; font-size: .9rem; line-height: 1.55; }
        .um-steps li::before { counter-increment: step; content: counter(step); position: absolute; left: 12px; top: 10px; width: 24px; height: 24px; border-radius: 50%; background: #0a1f8f; color: #fff; font-size: .74rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .um-tips { margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; font-size: .86rem; color: #78350f; }
        .um-tips strong { display: block; font-size: .74rem; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px; color: #b45309; }
        .um-tips ul { margin: 0; padding-left: 18px; }
        .um-tips li + li { margin-top: 4px; }
        .um-codes { width: 100%; margin-top: 14px; border-collapse: collapse; font-size: .86rem; }
        .um-codes th { text-align: left; background: #f8fafc; color: #64748b; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; padding: 8px 10px; border-bottom: 1px solid #e6e9f2; }
        .um-codes td { padding: 8px 10px; border-bottom: 1px solid #f0f2f7; }
        .um-codes td:first-child { font-weight: 800; color: #0a1f8f; width: 60px; }
        .um-faq { margin-top: 12px; display: grid; gap: 8px; }
        .um-faq details { background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; padding: 10px 14px; }
        .um-faq summary { font-weight: 700; cursor: pointer; font-size: .9rem; }
        .um-faq p { margin: 8px 0 2px; color: #475569; font-size: .88rem; line-height: 1.55; }
        .um-empty { background: #fff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 40px; text-align: center; color: #64748b; }
        .um-support { background: #0f172a; color: #e2e8f0; border-radius: 16px; padding: 18px 22px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; margin-top: 14px; }
        .um-support a { color: #93c5fd; font-weight: 700; }
        mark { background: #fde68a; padding: 0 2px; border-radius: 3px; }
        @media (max-width: 992px) { .um-layout { grid-template-columns: 1fr; } .um-toc { position: static; max-height: none; } }
      `}</style>

      <section className="um-hero">
        <div>
          <div className="um-eyebrow">AeroAttendance · Help</div>
          <h2>User Manual</h2>
          <p>
            {guide === 'admin'
              ? 'Step-by-step guide to every page of the admin portal, from first-day setup to attendance approvals, live tracking and monthly reports.'
              : 'Everything you need to use AeroAttendance every day: punch in and out, leave, tasks, salary slips and your account.'}
          </p>
        </div>
        {role === 'admin' && (
          <div className="um-switch" role="tablist" aria-label="Choose guide">
            <button type="button" className={guide === 'admin' ? 'active' : ''} onClick={() => { setGuide('admin'); setQuery(''); }}>Admin guide</button>
            <button type="button" className={guide === 'employee' ? 'active' : ''} onClick={() => { setGuide('employee'); setQuery(''); }}>Employee guide</button>
          </div>
        )}
      </section>

      <div className="um-layout">
        <aside className="um-toc">
          <input className="um-search" placeholder="Search the manual…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the manual" />
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <h6>{group}</h6>
              {items.map((chapter) => (
                <button key={chapter.id} type="button" onClick={() => jump(chapter.id)}>{chapter.title}</button>
              ))}
            </div>
          ))}
          {!visible.length && <div className="small text-muted">No results.</div>}
        </aside>

        <main>
          {!visible.length && <div className="um-empty">Nothing in the manual matches "{q}". Try another word, for example "late", "report" or "leave".</div>}
          {visible.map((chapter) => {
            number += 1;
            return (
              <article key={chapter.id} id={`um-${chapter.id}`} className="um-chapter">
                <div className="um-chapter-head">
                  <div>
                    <h3><span className="um-num">{number}</span>{highlight(chapter.title, q)}</h3>
                    <span className="um-where">{chapter.where}</span>
                  </div>
                  {chapter.tab && onNavigate && guide === 'admin' && (
                    <button type="button" className="um-open" onClick={() => onNavigate(chapter.tab)}>Open this page →</button>
                  )}
                </div>
                <p className="um-summary">{highlight(chapter.summary, q)}</p>
                {chapter.steps && (
                  <ol className="um-steps">
                    {chapter.steps.map((step) => <li key={step}>{highlight(step, q)}</li>)}
                  </ol>
                )}
                {chapter.codes && (
                  <table className="um-codes">
                    <thead><tr><th>Code</th><th>Meaning</th><th>When it is used</th></tr></thead>
                    <tbody>
                      {chapter.codes.map(([code, label, when]) => (
                        <tr key={code}><td>{code}</td><td>{label}</td><td>{when}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {chapter.faq && (
                  <div className="um-faq">
                    {chapter.faq.map(([question, answer]) => (
                      <details key={question} open={Boolean(q)}>
                        <summary>{highlight(question, q)}</summary>
                        <p>{highlight(answer, q)}</p>
                      </details>
                    ))}
                  </div>
                )}
                {chapter.tips && (
                  <div className="um-tips">
                    <strong>Good to know</strong>
                    <ul>{chapter.tips.map((tip) => <li key={tip}>{highlight(tip, q)}</li>)}</ul>
                  </div>
                )}
              </article>
            );
          })}

          <div className="um-support">
            <div>
              <strong style={{ display: 'block', color: '#fff' }}>Still need help?</strong>
              <span>Aerowheels support · Mon–Sat, office hours</span>
            </div>
            <div className="d-flex flex-wrap gap-3">
              <a href="mailto:marketing@aerowheels.co.in">marketing@aerowheels.co.in</a>
              <a href="tel:01146658638">011-46658638</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserManual;
