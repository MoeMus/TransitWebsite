import django.contrib.auth.models
import django.contrib.auth.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='Untitled', max_length=100)),
                ('department', models.CharField(default='No department', max_length=100)),
                ('class_number', models.CharField(default='000', max_length=20)),
                ('course_number', models.CharField(default=0, max_length=10)),
                ('section_name', models.CharField(default='D100', max_length=100)),
                ('description', models.TextField(blank=True, null=True)),
                ('term', models.CharField(blank=True, max_length=50, null=True)),
                ('delivery_method', models.CharField(blank=True, max_length=50, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='LectureSection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('section_code', models.CharField(max_length=10)),
                ('start_time', models.CharField(blank=True, max_length=50, null=True)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_time', models.CharField(blank=True, max_length=50, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('is_exam', models.BooleanField(default=False)),
                ('days', models.CharField(blank=True, max_length=50, null=True)),
                ('campus', models.CharField(blank=True, max_length=50, null=True)),
                ('class_type', models.CharField(blank=True, max_length=10, null=True)),
                ('professor', models.CharField(blank=True, max_length=100, null=True)),
                ('associated_class', models.CharField(default=0, max_length=50)),
                ('title', models.CharField(default='Untitled', max_length=100)),
                ('number', models.CharField(default='000', max_length=100)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.course')),
            ],
        ),
        migrations.CreateModel(
            name='NonLectureSection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('section_code', models.CharField(max_length=10)),
                ('class_type', models.CharField(max_length=10)),
                ('associated_class', models.CharField(default=0, max_length=10)),
                ('title', models.CharField(default='Untitled', max_length=100)),
                ('start_time', models.CharField(blank=True, max_length=100, null=True)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_time', models.CharField(blank=True, max_length=100, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('is_exam', models.BooleanField(default=False)),
                ('days', models.CharField(blank=True, max_length=100, null=True)),
                ('campus', models.CharField(blank=True, max_length=100, null=True)),
                ('professor', models.CharField(blank=True, max_length=100, null=True)),
                ('number', models.CharField(default='000', max_length=100)),
                ('lecture_section', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='non_lecture_sections', to='core.lecturesection')),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('Courses', models.ManyToManyField(blank=True, related_name='users', to='core.course')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='core_users', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='core_users', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
    ]
