# Changelog

**Version 0.0.16**
- Fixed typo in settings
- Corrected range for 5-day interval from 1 to 40 
- Corrected range for 16-day interval from 1 to 16 

**Version 0.0.15**
- Fixed min/max/evening/morning/night temp triggers 
- Sorted out 'Minimum' and 'Maximum' temperature description for 5-day  

**Version 0.0.14**
- Sorted out icons for Homey V2 UI.
- Removed duplicate capabilities from UI.
- Removed cron function due to Homey bug, changed to setInterval

**Version 0.0.13**
- Sorted out internationalization.
- Added size attributes to 'pairing' picture which wasn't displayed in App store.

**Version 0.0.12**
- Fixed encoding of special characters in city names (encodeURIComponent).
- Switched to http-min library for http requests.

**Version 0.0.11**
- Reduced filesize of .svg icons, saving nearly 12M storage space.

**Version 0.0.10**
- Corrected sunset/sunrise time (was UTC, is now Homey's local timezone).

