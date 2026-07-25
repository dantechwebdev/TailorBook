import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/store';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';

// ─── Screens ──────────────────────────────────────────────────────────────────
import HomeScreen from '../screens/home/HomeScreen';
import CustomerListScreen from '../screens/customers/CustomerListScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import CustomerCreateScreen from '../screens/customers/CustomerCreateScreen';
import CustomerEditScreen from '../screens/customers/CustomerEditScreen';
import JobListScreen from '../screens/jobs/JobListScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import NewOrderFlow from '../screens/jobs/NewOrderFlow/index';
import JobEditScreen from '../screens/jobs/JobEditScreen';
import MeasurementFormScreen from '../screens/measurements/MeasurementFormScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import AccountScreen from '../screens/settings/AccountScreen';
import SubscriptionScreen from '../screens/settings/SubscriptionScreen';
import HelpScreen from '../screens/settings/HelpScreen';
import FinancialsScreen from '../screens/financials/FinancialsScreen';
import TailorStudioScreen from '../screens/tailorstudio/TailorStudioScreen';
import ScratchPadScreen from '../screens/scratchpad/ScratchPadScreen';
import DrawerContent from '../components/common/DrawerContent';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// ─── Tab Icons ─────────────────────────────────────────────────────────────────
import {
  HomeIcon, JobsIcon, CustomersIcon, CalendarIcon, NotificationsIcon,
} from '../components/common/Icons';

// ─── Navigator instances ───────────────────────────────────────────────────────
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const CustomerStack = createStackNavigator();
const JobStack = createStackNavigator();
const ScheduleStack = createStackNavigator();

// ─── Stack Navigators ──────────────────────────────────────────────────────────

const HomeStackNav = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="SignIn" component={SignInScreen} options={{ animation: 'slide_from_bottom' } as any} />
    <HomeStack.Screen name="SignUp" component={SignUpScreen} options={{ animation: 'slide_from_bottom' } as any} />
  </HomeStack.Navigator>
);

const CustomerStackNav = () => (
  <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
    <CustomerStack.Screen name="CustomerList" component={CustomerListScreen} />
    <CustomerStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    <CustomerStack.Screen name="CustomerCreate" component={CustomerCreateScreen} />
    <CustomerStack.Screen name="CustomerEdit" component={CustomerEditScreen} />
    <CustomerStack.Screen name="NewOrderFlow" component={NewOrderFlow} />
    <CustomerStack.Screen name="JobDetail" component={JobDetailScreen} />
    <CustomerStack.Screen name="MeasurementForm" component={MeasurementFormScreen} />
  </CustomerStack.Navigator>
);

const JobStackNav = () => (
  <JobStack.Navigator screenOptions={{ headerShown: false }}>
    <JobStack.Screen name="JobList" component={JobListScreen} />
    <JobStack.Screen name="JobDetail" component={JobDetailScreen} />
    <JobStack.Screen name="NewOrderFlow" component={NewOrderFlow} />
    <JobStack.Screen name="JobEdit" component={JobEditScreen} />
    <JobStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    <JobStack.Screen name="MeasurementForm" component={MeasurementFormScreen} />
  </JobStack.Navigator>
);

const ScheduleStackNav = () => (
  <ScheduleStack.Navigator screenOptions={{ headerShown: false }}>
    <ScheduleStack.Screen name="Schedule" component={ScheduleScreen} />
    <ScheduleStack.Screen name="JobDetail" component={JobDetailScreen} />
  </ScheduleStack.Navigator>
);

// ─── Custom Tab Bar ────────────────────────────────────────────────────────────
// Built from scratch so it matches TailorBook's design system exactly.

const TabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  const { colors: C } = useTheme();
  const { unreadNotificationCount } = useStore();
  const insets = useSafeAreaInsets();

  const TABS = [
    { name: 'HomeTab',        label: 'Home',      Icon: HomeIcon },
    { name: 'JobsStack',      label: 'Jobs',       Icon: JobsIcon },
    { name: 'CustomersStack', label: 'Customers',  Icon: CustomersIcon },
    { name: 'ScheduleTab',    label: 'Schedule',   Icon: CalendarIcon },
    { name: 'NotificationsScreen', label: 'Alerts', Icon: NotificationsIcon },
  ];

  return (
    <View style={[tabStyles.bar, {
      backgroundColor: C.surface,
      borderTopColor: C.border,
      paddingBottom: insets.bottom || Spacing.sm,
    }]}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        const { Icon } = tab;
        const hasNotifBadge = tab.name === 'NotificationsScreen' && unreadNotificationCount > 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: state.routes[index]?.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <View key={tab.name} style={tabStyles.tabItem}>
            <View style={tabStyles.tabTouch}>
              {/* Active indicator pill */}
              {isFocused && (
                <View style={[tabStyles.activePill, { backgroundColor: C.primaryFaint }]} />
              )}
              <Icon
                size={22}
                color={isFocused ? C.primary : C.textTertiary}
                strokeWidth={isFocused ? 2.2 : 1.6}
              />
              <Text style={[tabStyles.tabLabel, { color: isFocused ? C.primary : C.textTertiary }]}>
                {tab.label}
              </Text>
              {hasNotifBadge && (
                <View style={[tabStyles.badge, { backgroundColor: C.overdue }]}>
                  <Text style={tabStyles.badgeText}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </View>
            {/* Tap target covers full cell */}
            <View
              style={StyleSheet.absoluteFill}
              // @ts-ignore
              onStartShouldSetResponder={() => true}
              onResponderGrant={onPress}
            />
          </View>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    ...Shadow.lg,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  tabTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xs,
    gap: 3,
    minWidth: 60,
    minHeight: 48,
  },
  activePill: {
    position: 'absolute',
    top: -6,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: Typography.medium,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: Typography.bold,
  },
});

// ─── Bottom Tab Navigator ──────────────────────────────────────────────────────

const MainTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="HomeTab" component={HomeStackNav} />
    <Tab.Screen name="JobsStack" component={JobStackNav} />
    <Tab.Screen name="CustomersStack" component={CustomerStackNav} />
    <Tab.Screen name="ScheduleTab" component={ScheduleStackNav} />
    <Tab.Screen name="NotificationsScreen" component={NotificationsScreen} />
  </Tab.Navigator>
);

// ─── Root Drawer (secondary navigation — wraps the tabs) ───────────────────────
// The drawer stays for Financials, ScratchPad, TailorStudio, Account, Settings.
// The four primary screens live in the tab bar.

const AppNavigator: React.FC = () => (
  <Drawer.Navigator
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: 'slide',
      drawerStyle: { width: 280 },
      overlayColor: 'rgba(0,0,0,0.4)',
      swipeEdgeWidth: 40,
    }}
  >
    {/* Primary — shown via tab bar */}
    <Drawer.Screen name="MainTabs"          component={MainTabs} />
    {/* Secondary — accessible only from drawer */}
    <Drawer.Screen name="FinancialsScreen"  component={FinancialsScreen} />
    <Drawer.Screen name="ScratchPadScreen"  component={ScratchPadScreen} />
    <Drawer.Screen name="TailorStudioScreen" component={TailorStudioScreen} />
    <Drawer.Screen name="AccountScreen"     component={AccountScreen} />
    <Drawer.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
    <Drawer.Screen name="HelpScreen"        component={HelpScreen} />
  </Drawer.Navigator>
);

export default AppNavigator;
