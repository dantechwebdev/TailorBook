import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';

// ─── Screens ─────────────────────────────────────────────────────────────────

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

// ─── Navigator Instances ──────────────────────────────────────────────────────

const Drawer = createDrawerNavigator();
const HomeStack = createStackNavigator();
const CustomerStack = createStackNavigator();
const JobStack = createStackNavigator();

// ─── Stack Navigators ─────────────────────────────────────────────────────────

const HomeStackNav = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
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

// ─── Root Drawer Navigator ────────────────────────────────────────────────────

const AppNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 280 },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="HomeTab"             component={HomeStackNav} />
      <Drawer.Screen name="CustomersStack"      component={CustomerStackNav} />
      <Drawer.Screen name="JobsStack"           component={JobStackNav} />
      <Drawer.Screen name="ScheduleScreen"      component={ScheduleScreen} />
      <Drawer.Screen name="FinancialsScreen"    component={FinancialsScreen} />
      <Drawer.Screen name="ScratchPadScreen"    component={ScratchPadScreen} />
      <Drawer.Screen name="TailorStudioScreen"  component={TailorStudioScreen} />
      <Drawer.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Drawer.Screen name="AccountScreen"       component={AccountScreen} />
      <Drawer.Screen name="SubscriptionScreen"  component={SubscriptionScreen} />
      <Drawer.Screen name="HelpScreen"          component={HelpScreen} />
    </Drawer.Navigator>
  );
};

export default AppNavigator;
