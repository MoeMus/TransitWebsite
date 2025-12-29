from django.core.management.base import BaseCommand
from core import cron

class Command(BaseCommand):

    def handle(self, *args, **options):

        self.stdout.write(self.style.SUCCESS('Running cron job'))

        cron.update_course_data()

        self.stdout.write(self.style.SUCCESS('Finished cron job'))