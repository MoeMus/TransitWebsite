from django.core.management.base import BaseCommand
from core import cron

class Command(BaseCommand):

    def handle(self, *args, **options):

        self.stdout.write(self.style.SUCCESS('Removing expired OTPs'))

        cron.remove_expired_otps()

        self.stdout.write(self.style.SUCCESS('Finished Removing expired OTPs'))
