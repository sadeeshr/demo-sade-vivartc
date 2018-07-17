import requests
from .models import Channel
from vox.models import Contact
from iris.models import Meeting

from datetime import datetime

import logging

class suitecrm(object):

    ACCESS_TOKEN_URL = "/api/oauth/access_token"
    MODULES_URL = "/api/v8/modules/meta/list"
    LEADS_URL = "/api/v8/modules/Leads"
    CONTACTS_URL = "/api/v8/modules/Contacts"
    MEETINGS_URL = "/api/v8/modules/Meetings"
    ACCOUNTS_URL = "/api/v8/modules/Accounts"
    CALLS_URL = "/api/v8/modules/Calls"

    def __init__(self):
        self._headers = {
            'Content-type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
        }
        self._channel = None

    def connect(self, channel):
        try:
            if channel.suitecrm is None:
                return 
            self._channel = channel
            sc = channel.suitecrm

            params = {
                'grant_type': 'client_credentials',
                'client_id': sc.client_id,
                'client_secret': sc.client_secret,
                'scope' : 'standard:create standard:read standard:update standard:delete standard:delete standard:relationship:create standard:relationship:read standard:relationship:update standard:relationship:delete'
            }
            url = "{0}{1}".format(channel.address, self.ACCESS_TOKEN_URL)
            response = requests.post(url, json=params, headers=self._headers)
            if response.status_code == 200:       
                result = response.json()
                sc.auth_response = result
                sc.save()

                auth_header_val = "Bearer {}".format(result["access_token"])
                self._headers["Authorization"] = auth_header_val
 
        except Exception as err:
            logging.warning("SuiteCrm connect {}".format(str(err))) 

    def modules(self):
        url = "{0}{1}".format(self._channel.address, self.MODULES_URL)
        response = requests.get(url, headers=self._headers)
        if response.status_code == 200:
            result = response.json()
            url = "{0}{1}".format(self._channel.address, self.CALLS_URL) 
            response = requests.get(url, headers=self._headers)
            result = response.json()
            print(result)

    """
    Log a call in suitecrm
    @param call handle
    """
    def log_call(self, call):
        try:
            url = "{0}{1}".format(self._channel.address, self.CALLS_URL)
            peer = call.peer 
            try:
                contact = Contact.objects.filter(mobile=peer).first()

            except Exception as err:
                return

            delta_secs = (call.end - call.start).seconds
            if delta_secs < 60:
                dur_hours = 0
                dur_mins = 1
            else:
                dur_hours = delta_secs//3600    
                dur_mins  = (delta_secs//60)%60

            start = call.start.strftime("%m/%d/%Y %H:%M")
            end = call.end.strftime("%m/%d/%Y %H:%M")
            direction = "inbound"
            if call.direction == '2':
                direction = "outbound"
            

            attributes = {"name": "VivaRTC Call", 
                          "duration_hours":dur_hours, "duration_minutes": dur_mins, 
                          "direction": direction, "date_start": start,"date_end": end,
                          'assigned_user_id': '1','parent_type': contact.source_module, 'parent_id':contact.source_id,
                          'status': 'Planned','created_by': '1'
            }

            params = {
                "data": {
                    "type":"Calls",
                    "attributes":attributes
                }
            }
             
            response = requests.post(url, json=params, headers=self._headers)
            print(response)
            print(response.json())

        except Exception as err:
            logging.warning("SuiteCrm log call error {}".format(str(err)))

           
    def sync_contacts(self):
        try:
            if self._channel.last_sync is not None:
                dt_str = self._channel.last_sync.strftime("%Y-%m-%dT%H:%M:%S") 
                url = "{0}{1}?filter[Contacts.date_modified]=[[gt]]{2}".format(self._channel.address, self.CONTACTS_URL, dt_str)
            else:
                url = "{0}{1}".format(self._channel.address, self.CONTACTS_URL)

            response = requests.get(url, headers=self._headers)
            if response.status_code == 200:
                result = response.json()
                data = result["data"]
                # No records found
                if data is None:
                    return
                for contact in data:
                    fields = contact["attributes"]
                    contact, created = Contact.objects.get_or_create(source_id=contact["id"], source_module="Contacts")
                    contact.first_name = fields["first_name"]
                    contact.last_name  = fields["last_name"]
                    contact.mobile = fields["phone_mobile"]
                    contact.work = fields["phone_work"]
                    contact.channel = self._channel
                    contact.save()
               
            

        except Exception as err:
            logging.warning("SuiteCrm sync contacts {}".format(str(err))) 


    def sync_leads(self):
        try:
            if self._channel.last_sync is not None:
                dt_str = self._channel.last_sync.strftime("%Y-%m-%dT%H:%M:%S")
                url = "{0}{1}?filter[Leads.date_modified]=[[gt]]{2}".format(self._channel.address, self.LEADS_URL, dt_str)
            else:
                url = "{0}{1}".format(self._channel.address, self.LEADS_URL)

            response = requests.get(url, headers=self._headers)
            if response.status_code == 200:
                result = response.json()
                data = result["data"]
                # No records found
                if data is None:
                    return

                for lead in data:
                    fields = lead["attributes"]
                    contact, created = Contact.objects.get_or_create(source_id=lead["id"], source_module="Leads")
                    contact.first_name = fields["first_name"]
                    contact.last_name  = fields["last_name"]
                    contact.mobile = fields["phone_mobile"]
                    contact.work = fields["phone_work"]
                    contact.channel = self._channel
                    contact.save()

        except Exception as err:
            logging.warning("SuiteCrm sync leads {}".format(str(err)))

    """
    TBD
    """
    def sync_accounts(self):
        try:
           pass  

        except Exception as err:
            logging.warning("SuiteCrm sync accounts {}".format(str(err)))


    def sync_meetings(self):
        try:
            if self._channel.last_sync is not None:
                dt_str = self._channel.last_sync.strftime("%Y-%m-%dT%H:%M:%S")
                url = "{0}{1}?filter[Meetings.date_modified]=[[gt]]{2}".format(self._channel.address, self.MEETINGS_URL, dt_str)
            else:
                url = "{0}{1}".format(self._channel.address, self.MEETINGS_URL)

            response = requests.get(url, headers=self._headers)
            if response.status_code == 200:
                result = response.json()
                data = result["data"]
                # No records found
                if data is None:
                    return
            
                for meeting in data:
                    fields = meeting["attributes"] 
                    # 'date_start', name, date_end, date_start, created_by 
                    dt_start = datetime.strptime(fields["date_start"], "%m/%d/%Y %H:%M")
                    dt_end   = datetime.strptime(fields["date_end"], "%m/%d/%Y %H:%M")
                    meeting, created = Meeting.objects.get_or_create(source_id=meeting["id"], 
                                                                     defaults={'subject': fields["name"], 'start':dt_start, 'end':dt_end})
                    meeting.start    = datetime.strptime(fields["date_start"], "%m/%d/%Y %H:%M")
                    meeting.end      = datetime.strptime(fields["date_end"], "%m/%d/%Y %H:%M")
                    meeting.save()

        except Exception as err:
            logging.warning("SuiteCrm sync accounts {}".format(str(err)))
