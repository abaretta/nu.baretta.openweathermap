# Changelog

**Version 0.0.21**
- Fixed issue with condition flowcard trigger
- Added snow measurement

**Version 0.0.20**
- Added type checks to rain parameter which can be either an object or a number (or occassionally null...).

**Version 0.0.19**
- Attempt to fix null/0 values for rain parameter.

**Version 0.0.18**
- Sunset/sunrise format sorted out in the owmCurrent driver.

**Version 0.0.17**
- Special V1 compatible alpha version, available on request.

**Version 0.0.16**
- Fixed typo in settings

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

