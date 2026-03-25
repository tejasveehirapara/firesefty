import { Plus, Search } from "lucide-react";
import Button from "./ui/Button";
import DatePicker from "./ui/DatePicker";
import Select from "./ui/Select";
import Input from "./ui/Input";

const PageTitlePart = ({ buttonOnClick, buttonLabel, searchInput, onChange, placeholder, startDate, endDate, setStartDate, setEndDate, isDateRange = false, isStatusFilter = false, statusOptions, handleStatusChange, selectedStatus, datePickerPlaceHolder, onDateChange, isExport, onExport }) => {
    return (
        <div className="px-2 sm:px-4 pt-6 flex flex-col lg:flex-row flex-wrap justify-between items-stretch lg:items-end gap-4 w-full">
            <Input
                placeholder={placeholder}
                value={searchInput}
                onChange={onChange}
                startIcon={<Search className="w-4 h-4" />}
                className="w-full lg:w-[280px] xl:w-[320px]" />
            {/* <div className="flex flex-col md:flex-row items-stretch lg:items-end gap-3 w-full lg:w-auto order-2 lg:order-1">

            </div> */}

            <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto order-1 lg:order-2">
                {isDateRange && <DatePicker
                    mode="range"
                    value={{ start: startDate, end: endDate }}
                    onChange={(val) => {
                        onDateChange()
                        setStartDate(val.start ? val.start : "");
                        setEndDate(val.end ? val.end : "");
                    }}
                    placeholder={datePickerPlaceHolder}
                    className="w-full lg:w-[280px] xl:w-[320px]"
                />}
                {isStatusFilter && <Select
                    isClearable={selectedStatus !== ""}
                    // backgroundColor="#f9fafb"
                    value={statusOptions.find((item) => item.value === selectedStatus) || { label: "All", value: "" }}
                    options={[{ label: "All", value: "" }, ...statusOptions]}
                    onChange={handleStatusChange}
                    className="w-full lg:w-[150px] xl:w-[180px]"
                />}
                <div className="flex gap-3">
                    <Button
                        label={buttonLabel}
                        startIcon={<Plus className="w-4 h-4" />}
                        onClick={buttonOnClick}
                        className="w-fit md:w-auto text-nowrap"
                    />
                    {isExport && <Button
                        variant="outline"
                        label="Export"
                        onClick={onExport}
                        className="w-fit md:w-auto text-nowrap"
                    />}
                </div>
            </div>
        </div>
    );
};

export default PageTitlePart;