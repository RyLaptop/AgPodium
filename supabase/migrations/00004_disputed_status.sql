-- Add 'disputed' status for when a speaker self-reports that the org
-- never confirmed their appearance after the meeting passed.
alter type request_status add value if not exists 'disputed';
