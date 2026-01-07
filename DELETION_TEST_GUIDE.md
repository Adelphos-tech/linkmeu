# 🧪 Event Deletion Testing Guide

## 📋 **Testing the Deletion Feature**

### **Local Testing (RECOMMENDED)**

The dev server is running at: **http://localhost:3000**

#### **Step 1: Open Browser Dev Tools**
1. Open Chrome or Firefox
2. Go to: `http://localhost:3000/admin`
3. Press `F12` or `Cmd+Option+I` (Mac) to open Developer Tools
4. Click on the **Console** tab

#### **Step 2: Login as Admin**
- Email: `Robocorpsg@gmail.com`
- Password: `[REDACTED]`

#### **Step 3: Delete an Event**
1. Find any event in the list
2. Click the red **"Delete"** button
3. Confirm both dialogs
4. **Watch the Console** - You should see:
   ```
   [DELETE] Starting deletion of event X: Event Name
   [DELETE] Successfully deleted event X
   [DELETE] Verified: Event X no longer exists in database
   [EVENTS] Events list updated. Count: Y
   ```

#### **Step 4: Verify**
- ✅ Event disappears from the list immediately
- ✅ No errors in console
- ✅ Event count decreases by 1
- ✅ Reload page - event should stay deleted

---

## 🔍 **What to Look For**

### **✅ SUCCESS Indicators:**
1. Console shows all 3 DELETE log messages
2. Console shows EVENTS list updated with new count
3. Event disappears from UI immediately
4. No errors in console
5. After page reload, event is still gone

### **❌ FAILURE Indicators:**
1. Event still visible after deletion
2. Console shows "Event still exists after deletion" error
3. Event reappears after page reload
4. Console shows no EVENTS update after deletion

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: Event Still Shows After Deletion**
**Symptoms:** Event visible in UI, but console says it was deleted

**Fix:**
```javascript
// Check in console:
const events = await db.events.toArray();
console.log('Current events:', events);

// If event is missing but UI shows it, it's a React rendering issue
```

**Solution:** Clear browser cache, hard refresh (`Cmd+Shift+R`)

### **Issue 2: useLiveQuery Not Updating**
**Symptoms:** Console shows deletion successful, but EVENTS list doesn't update

**Possible causes:**
- Dexie transaction not committing
- useLiveQuery not reacting to changes
- Browser cache issue

**Fix:** Check if this is logged:
```
[EVENTS] Events list updated. Count: X
```
If not logged after deletion, useLiveQuery isn't reacting.

### **Issue 3: "Event still exists" Error**
**Symptoms:** Console shows error immediately after deletion attempt

**This means:** The deleteEvent function didn't actually delete from database

**Fix:** Check database.js deleteEvent implementation

---

## 🔬 **Advanced Testing**

### **Test Case 1: Delete Multiple Events**
1. Delete event A
2. Verify it disappears
3. Delete event B
4. Verify it disappears
5. Reload page
6. Verify both are gone

### **Test Case 2: Delete Event with Attendees**
1. Go to an event page
2. Register some attendees (use the registration form)
3. Go back to /admin
4. Delete that event
5. Console should show: "All registrations (X people)"
6. Verify attendees are also deleted from database:
   ```javascript
   const attendees = await db.attendees.where('eventId').equals(deletedEventId).toArray();
   console.log('Remaining attendees:', attendees); // Should be []
   ```

### **Test Case 3: Cancel Deletion**
1. Click Delete
2. Click Cancel on first dialog
3. Verify event is NOT deleted
4. Click Delete again
5. Click OK on first, Cancel on second
6. Verify event is NOT deleted

---

## 📊 **Expected Console Output**

### **On Page Load:**
```
[EVENTS] Events list updated. Count: 5
```

### **During Successful Deletion:**
```
[DELETE] Starting deletion of event 3: Tech Conference 2025
[DELETE] Successfully deleted event 3
[DELETE] Verified: Event 3 no longer exists in database
[EVENTS] Events list updated. Count: 4
```

### **If Deletion Fails:**
```
[DELETE] Starting deletion of event 3: Tech Conference 2025
[DELETE] ERROR: Event 3 still exists after deletion!
[DELETE] Error deleting event: Error: Event was not properly deleted from database
```

---

## 🚀 **Testing on Deployed Site**

Once DNS is fixed (linkmeu.com points to GitHub Pages properly):

1. Go to: `http://linkmeu.com/admin`
2. Login with admin credentials
3. Open browser console (`F12`)
4. Follow the same testing steps above

**Note:** Deployed version uses IndexedDB in the browser, so:
- Each browser has its own database
- Clearing browser data will reset events
- Incognito mode will have empty database

---

## 📝 **Manual Database Inspection**

### **Check Database Contents:**
```javascript
// In browser console:

// List all events
db.events.toArray().then(events => {
  console.table(events);
});

// List all attendees
db.attendees.toArray().then(attendees => {
  console.table(attendees);
});

// Check specific event
db.events.get(5).then(event => {
  console.log('Event 5:', event);
});
```

---

## ✅ **Success Criteria**

The deletion feature is working correctly if ALL of these are true:

- [ ] Event disappears immediately after deletion
- [ ] Console shows all 3 DELETE log messages
- [ ] Console shows EVENTS list update with decremented count
- [ ] Event stays deleted after page reload
- [ ] Associated attendees are also deleted
- [ ] Cancel buttons work (don't delete)
- [ ] Multiple deletions work in sequence
- [ ] No errors in console

---

## 🆘 **If Still Not Working**

### **Fallback Solution: Force Refresh After Deletion**

If Dexie's auto-reactivity is still not working, we can add a manual refresh:

```javascript
// Add this state back
const [refreshKey, setRefreshKey] = useState(0);
const events = useLiveQuery(() => db.events.toArray(), [refreshKey]);

// After successful deletion
await deleteEvent(eventId);
setRefreshKey(prev => prev + 1);
```

### **Nuclear Option: Full Page Reload**

```javascript
// After successful deletion
await deleteEvent(eventId);
window.location.reload();
```

This will always work but is not user-friendly.

---

## 📞 **Reporting Issues**

If deletion is still not working, provide:

1. **Browser:** Chrome/Firefox/Safari and version
2. **Console output:** Copy all DELETE and EVENTS logs
3. **Steps taken:** Exact sequence of actions
4. **Expected vs Actual:** What should happen vs what did happen
5. **Database state:** Run `db.events.toArray()` and share result

---

**Test it now and let me know the results! 🧪**
